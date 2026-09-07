export const MOCK_DASHBOARD_STATS = {
  total_records: 25,
  verified_records: 17,
  pending_verification: 7,
  high_risk_records: 1,
  processed_today: 5,
  average_ocr_confidence: 96.2,
  average_validation_score: 90.4,
  total_documents: 5,
  records_by_status: {
    VERIFIED: 17,
    NEEDS_REVIEW: 7,
    REJECTED: 1
  },
  records_by_risk: {
    LOW: 17,
    MEDIUM: 7,
    CRITICAL: 1
  },
  documents_by_type: {
    PATTA: 2,
    SALE_DEED: 2,
    TAX_RECEIPT: 1
  },
  anomalies_by_severity: {
    MEDIUM: 1,
    CRITICAL: 1
  },
  records_by_district: {
    Erode: 25
  },
  recent_activity: [
    {
      id: "log-1",
      record_id: "rec-145-2a",
      user_name: "Dr. S. Arumugam IAS",
      user_role: "ADMIN",
      action: "RECORD_VERIFIED_APPROVED",
      reason: "Automated OCR digitization and cadastral spatial validation completed.",
      created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString()
    },
    {
      id: "log-2",
      record_id: "rec-89-1",
      user_name: "K. Selvakumar",
      user_role: "OFFICER",
      action: "MUTATION_INTEGRATED",
      reason: "DILRMP auto-mutation synced with State SRO Registry.",
      created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString()
    },
    {
      id: "log-3",
      record_id: "rec-145-clone",
      user_name: "AI Fraud Detector",
      user_role: "SYSTEM",
      action: "ANOMALY_DETECTED",
      reason: "Future registration date and physical polygon overlap with Survey 145/2A.",
      created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString()
    },
    {
      id: "log-4",
      record_id: "rec-210-3c",
      user_name: "P. Meenakshi",
      user_role: "VERIFIER",
      action: "FIELD_CORRECTION",
      reason: "Phonetic Tamil-to-English transliteration normalized for landowner name.",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    }
  ]
};

export const MOCK_RECORDS = [
  {
    record_id: "REC-TN-ERD-145-2A",
    id: "rec-145-2a",
    status: "NEEDS_REVIEW",
    risk_level: "MEDIUM",
    validation_score: 78.5,
    owner: {
      name: "Ravi Kumar",
      father_or_husband: "S. Kumar",
      tamil_name: "ரவிகுமார்",
      aadhaar_masked: "XXXX-XXXX-8921",
      phone: "+91 98421 00001"
    },
    property: {
      survey_number: "145/2A",
      subdivision: "2A",
      khasra_number: "KH-145",
      khata_number: "KT-882",
      land_type: "Dry Agricultural (Punja)",
      recorded_area_acres: 2.45,
      gis_area_acres: 2.39,
      area_deviation_pct: 2.45
    },
    location: {
      village: "Thudupathi",
      taluk: "Perundurai",
      district: "Erode",
      state: "Tamil Nadu"
    },
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    record_id: "REC-TN-ERD-89-1",
    id: "rec-89-1",
    status: "VERIFIED",
    risk_level: "LOW",
    validation_score: 96.2,
    owner: {
      name: "Suresh Murugan",
      father_or_husband: "M. Murugan",
      tamil_name: "சுரேஷ் முருகன்",
      aadhaar_masked: "XXXX-XXXX-4512",
      phone: "+91 98421 00002"
    },
    property: {
      survey_number: "89/1",
      subdivision: "1",
      khasra_number: "KH-89",
      khata_number: "KT-412",
      land_type: "Wet Agricultural (Nanja)",
      recorded_area_acres: 3.15,
      gis_area_acres: 3.15,
      area_deviation_pct: 0.0
    },
    location: {
      village: "Nasiyanur",
      taluk: "Erode",
      district: "Erode",
      state: "Tamil Nadu"
    },
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  },
  {
    record_id: "REC-TN-ERD-210-3C",
    id: "rec-210-3c",
    status: "VERIFIED",
    risk_level: "LOW",
    validation_score: 94.0,
    owner: {
      name: "Anitha Shanmugam",
      father_or_husband: "K. Shanmugam",
      tamil_name: "அனிதா சண்முகம்",
      aadhaar_masked: "XXXX-XXXX-7721",
      phone: "+91 98421 00003"
    },
    property: {
      survey_number: "210/3C",
      subdivision: "3C",
      khasra_number: "KH-210",
      khata_number: "KT-104",
      land_type: "Dry Agricultural (Punja)",
      recorded_area_acres: 4.50,
      gis_area_acres: 4.50,
      area_deviation_pct: 0.0
    },
    location: {
      village: "Perundurai",
      taluk: "Perundurai",
      district: "Erode",
      state: "Tamil Nadu"
    },
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  },
  {
    record_id: "REC-TN-ERD-45-1",
    id: "rec-45-1",
    status: "VERIFIED",
    risk_level: "LOW",
    validation_score: 91.5,
    owner: {
      name: "Mohanraj Palanisamy",
      father_or_husband: "P. Palanisamy",
      tamil_name: "மோகன்ராஜ் பழனிசாமி",
      aadhaar_masked: "XXXX-XXXX-3390",
      phone: "+91 98421 00004"
    },
    property: {
      survey_number: "45/1",
      subdivision: "1",
      khasra_number: "KH-45",
      khata_number: "KT-920",
      land_type: "Commercial / House Site",
      recorded_area_acres: 1.20,
      gis_area_acres: 1.20,
      area_deviation_pct: 0.0
    },
    location: {
      village: "Chithode",
      taluk: "Erode",
      district: "Erode",
      state: "Tamil Nadu"
    },
    created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString()
  },
  {
    record_id: "REC-TN-ERD-112-4",
    id: "rec-112-4",
    status: "VERIFIED",
    risk_level: "LOW",
    validation_score: 88.0,
    owner: {
      name: "Karthik Venkatachalam",
      father_or_husband: "V. Venkatachalam",
      tamil_name: "கார்த்திக் வெங்கடாசலம்",
      aadhaar_masked: "XXXX-XXXX-1129",
      phone: "+91 98421 00005"
    },
    property: {
      survey_number: "112/4",
      subdivision: "4",
      khasra_number: "KH-112",
      khata_number: "KT-301",
      land_type: "Wet Agricultural (Nanja)",
      recorded_area_acres: 5.80,
      gis_area_acres: 5.80,
      area_deviation_pct: 0.0
    },
    location: {
      village: "Kavindapadi",
      taluk: "Bhavani",
      district: "Erode",
      state: "Tamil Nadu"
    },
    created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString()
  },
  {
    record_id: "REC-TN-ERD-145-CLONE",
    id: "rec-145-clone",
    status: "REJECTED",
    risk_level: "CRITICAL",
    validation_score: 42.0,
    owner: {
      name: "Rajan Velusamy",
      father_or_husband: "V. Velusamy",
      tamil_name: "ராஜன் வேலுசாமி",
      aadhaar_masked: "XXXX-XXXX-9999",
      phone: "+91 98421 99999"
    },
    property: {
      survey_number: "145/2A-CLONE",
      subdivision: "2A",
      khasra_number: "KH-145",
      khata_number: "KT-882",
      land_type: "Dry Agricultural (Punja)",
      recorded_area_acres: 2.85,
      gis_area_acres: 2.39,
      area_deviation_pct: 19.2
    },
    location: {
      village: "Thudupathi",
      taluk: "Perundurai",
      district: "Erode",
      state: "Tamil Nadu"
    },
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString()
  }
];

export const MOCK_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.715, 11.34],
            [77.718, 11.34],
            [77.718, 11.342],
            [77.715, 11.342],
            [77.715, 11.34]
          ]
        ]
      },
      properties: {
        id: "p-1",
        survey_number: "145/2A",
        subdivision: "2A",
        village: "Thudupathi",
        taluk: "Perundurai",
        district: "Erode",
        state: "Tamil Nadu",
        gis_area_acres: 2.39,
        risk_level: "MEDIUM",
        has_overlap: false,
        adjacent_surveys: ["145/1", "145/2B", "145/3", "146/2"]
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.718, 11.34],
            [77.7205, 11.34],
            [77.7205, 11.342],
            [77.718, 11.342],
            [77.718, 11.34]
          ]
        ]
      },
      properties: {
        id: "p-2",
        survey_number: "145/2B",
        subdivision: "2B",
        village: "Thudupathi",
        taluk: "Perundurai",
        district: "Erode",
        state: "Tamil Nadu",
        gis_area_acres: 1.85,
        risk_level: "LOW",
        has_overlap: false,
        adjacent_surveys: ["145/2A", "145/4", "146/1"]
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.721, 11.343],
            [77.7245, 11.343],
            [77.7245, 11.3455],
            [77.721, 11.3455],
            [77.721, 11.343]
          ]
        ]
      },
      properties: {
        id: "p-3",
        survey_number: "89/1",
        subdivision: "1",
        village: "Nasiyanur",
        taluk: "Erode",
        district: "Erode",
        state: "Tamil Nadu",
        gis_area_acres: 3.15,
        risk_level: "LOW",
        has_overlap: false,
        adjacent_surveys: ["89/2", "88/4", "90/1"]
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.711, 11.342],
            [77.714, 11.342],
            [77.714, 11.345],
            [77.711, 11.345],
            [77.711, 11.342]
          ]
        ]
      },
      properties: {
        id: "p-4",
        survey_number: "210/3C",
        subdivision: "3C",
        village: "Perundurai",
        taluk: "Perundurai",
        district: "Erode",
        state: "Tamil Nadu",
        gis_area_acres: 4.5,
        risk_level: "LOW",
        has_overlap: false,
        adjacent_surveys: ["210/3A", "210/3B", "211/1"]
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.717, 11.341],
            [77.7195, 11.341],
            [77.7195, 11.343],
            [77.717, 11.343],
            [77.717, 11.341]
          ]
        ]
      },
      properties: {
        id: "p-6",
        survey_number: "145/2A-CLONE",
        subdivision: "2A",
        village: "Thudupathi",
        taluk: "Perundurai",
        district: "Erode",
        state: "Tamil Nadu",
        gis_area_acres: 2.85,
        risk_level: "CRITICAL",
        has_overlap: true,
        adjacent_surveys: ["145/2A", "145/2B"]
      }
    }
  ]
};
