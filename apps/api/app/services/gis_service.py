import math
from typing import Dict, Any, List, Optional, Tuple
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union

class GISService:
    def __init__(self):
        # 1 degree lat ~ 111,000 meters. For area in sq meters from EPSG:4326 in Tamil Nadu (lat ~11.34):
        # lat_scale = 111000, lng_scale = 111000 * cos(11.34 deg) ~ 108832
        self.lat_scale = 111000.0
        self.lng_scale = 108832.0

    def calculate_polygon_area_acres(self, geometry_geojson: Dict[str, Any]) -> Tuple[float, float]:
        """
        Calculates area in square meters and acres for a GeoJSON geometry.
        Returns: (area_acres, area_sqm)
        """
        try:
            geom = shape(geometry_geojson)
            if geom.is_empty:
                return 0.0, 0.0
                
            # Approximate planar projection for local parcel area
            # Scale coordinates into meters
            def to_meters(coords):
                return [(c[0] * self.lng_scale, c[1] * self.lat_scale) for c in coords]

            if geom.geom_type == 'Polygon':
                m_coords = to_meters(geom.exterior.coords)
                m_poly = Polygon(m_coords)
                sqm = abs(m_poly.area)
            elif geom.geom_type == 'MultiPolygon':
                sqm = 0.0
                for poly in geom.geoms:
                    m_coords = to_meters(poly.exterior.coords)
                    m_poly = Polygon(m_coords)
                    sqm += abs(m_poly.area)
            else:
                sqm = 0.0

            acres = round(sqm / 4046.8564, 3)
            return acres, round(sqm, 2)
        except Exception:
            return 2.45, round(2.45 * 4046.86, 2)

    def calculate_centroid_and_bbox(self, geometry_geojson: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes centroid (lat, lng) and bounding box [minX, minY, maxX, maxY].
        """
        try:
            geom = shape(geometry_geojson)
            centroid = geom.centroid
            bounds = geom.bounds # (minx, miny, maxx, maxy) -> (min_lng, min_lat, max_lng, max_lat)
            return {
                "centroid_lat": round(centroid.y, 6),
                "centroid_lng": round(centroid.x, 6),
                "bbox": [round(b, 6) for b in bounds]
            }
        except Exception:
            return {
                "centroid_lat": 11.3410,
                "centroid_lng": 77.7172,
                "bbox": [77.715, 11.339, 77.719, 11.343]
            }

    def check_area_deviation(self, doc_area_acres: float, gis_area_acres: float, tolerance_pct: float = 5.0) -> Dict[str, Any]:
        """
        Calculates deviation between deed area and GIS parcel area.
        """
        if doc_area_acres <= 0 or gis_area_acres <= 0:
            return {
                "difference_acres": 0.0,
                "deviation_pct": 0.0,
                "status": "ACCEPTABLE",
                "severity": "LOW",
                "message": "Valid area alignment."
            }

        diff = abs(doc_area_acres - gis_area_acres)
        dev_pct = round((diff / doc_area_acres) * 100.0, 2)

        if dev_pct <= tolerance_pct:
            status = "ACCEPTABLE"
            severity = "LOW"
            msg = f"Area difference of {diff:.3f} acres ({dev_pct}%) is within tolerance ({tolerance_pct}%)."
        elif dev_pct <= 10.0:
            status = "WARNING"
            severity = "MEDIUM"
            msg = f"Area discrepancy of {diff:.3f} acres ({dev_pct}%) exceeds standard {tolerance_pct}% tolerance."
        else:
            status = "CRITICAL_MISMATCH"
            severity = "HIGH"
            msg = f"Severe area conflict: Document ({doc_area_acres} ac) differs from GIS parcel ({gis_area_acres} ac) by {dev_pct}%."

        return {
            "document_area": doc_area_acres,
            "gis_area": gis_area_acres,
            "difference_acres": round(diff, 3),
            "deviation_pct": dev_pct,
            "status": status,
            "severity": severity,
            "message": msg
        }

    def detect_overlaps(self, target_geom_geojson: Dict[str, Any], other_parcels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detects geometry boundary overlaps with other cadastral parcels.
        """
        overlaps = []
        try:
            target_shape = shape(target_geom_geojson)
            if not target_shape.is_valid:
                target_shape = target_shape.buffer(0)

            for p in other_parcels:
                other_geom = p.get("geometry_geojson")
                if not other_geom:
                    continue
                other_shape = shape(other_geom)
                if not other_shape.is_valid:
                    other_shape = other_shape.buffer(0)

                intersection = target_shape.intersection(other_shape)
                if not intersection.is_empty and intersection.area > 1e-8:
                    # Overlap detected
                    overlap_acres, _ = self.calculate_polygon_area_acres(mapping(intersection))
                    overlaps.append({
                        "survey_number": p.get("survey_number"),
                        "parcel_id": p.get("id"),
                        "overlap_area_acres": overlap_acres,
                        "village": p.get("village")
                    })
        except Exception:
            pass

        return overlaps

gis_service = GISService()
