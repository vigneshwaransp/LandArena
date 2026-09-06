import os
import io
import math
from pathlib import Path
from typing import List, Tuple, Dict, Any
from PIL import Image, ImageOps, ImageEnhance
import fitz  # PyMuPDF
import cv2
import numpy as np

class PreprocessingService:
    def __init__(self):
        pass

    def convert_pdf_to_images(self, pdf_path: str, output_dir: Path) -> List[Tuple[str, int, int]]:
        """
        Converts each page of a PDF into high-res PNG image.
        Returns list of tuples: (image_path, width, height)
        """
        doc = fitz.open(pdf_path)
        page_images = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Render at 300 DPI (zoom matrix of ~4.16 for 72 dpi base)
            zoom = 2.0  # 2x zoom for sharp OCR and fast rendering
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            
            filename = f"{Path(pdf_path).stem}_page_{page_num + 1}.png"
            target_path = output_dir / filename
            pix.save(str(target_path))
            
            page_images.append((str(target_path), pix.width, pix.height))
            
        doc.close()
        return page_images

    def process_image(self, image_path: str, output_path: str) -> Dict[str, Any]:
        """
        Runs document image enhancement pipeline:
        Grayscale -> Denoise -> Deskew -> CLAHE Contrast -> Adaptive Threshold.
        """
        img = cv2.imread(image_path)
        if img is None:
            # Fallback with PIL
            pil_img = Image.open(image_path).convert("L")
            pil_img = ImageOps.autocontrast(pil_img)
            pil_img.save(output_path)
            return {"skew_angle": 0.0, "processed_path": output_path}

        # 1. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        # 2. Denoise using bilateral filter to preserve edges
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)

        # 3. Deskew Angle Detection using minAreaRect on thresholded edges
        skew_angle = 0.0
        try:
            thresh_deskew = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
            coords = np.column_stack(np.where(thresh_deskew > 0))
            if len(coords) > 100:
                angle = cv2.minAreaRect(coords)[-1]
                if angle < -45:
                    angle = -(90 + angle)
                else:
                    angle = -angle
                if abs(angle) > 0.5 and abs(angle) < 45.0:
                    skew_angle = angle
                    (h, w) = gray.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, skew_angle, 1.0)
                    denoised = cv2.warpAffine(denoised, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        except Exception:
            skew_angle = 0.0

        # 4. CLAHE Contrast Enhancement
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # 5. Adaptive Thresholding
        binary = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8
        )

        cv2.imwrite(output_path, binary)

        return {
            "skew_angle": round(skew_angle, 2),
            "processed_path": output_path
        }

    def generate_thumbnail(self, image_path: str, thumbnail_path: str, max_size: Tuple[int, int] = (300, 400)):
        with Image.open(image_path) as img:
            img.thumbnail(max_size)
            img.save(thumbnail_path, "JPEG", quality=85)

preprocessing_service = PreprocessingService()
