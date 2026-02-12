"""
FireSight — Automatic Number Plate Recognition (ANPR)
Uses YOLO for plate detection + EasyOCR for text extraction.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from ultralytics import YOLO

from app.config import settings


class ANPRDetector:
    """Number plate detection and recognition."""

    def __init__(self):
        self.plate_model: Optional[YOLO] = None
        self.ocr_reader = None
        self.confidence = 0.5

    def load_models(self):
        """Load plate detection model and OCR reader."""
        import os
        if os.path.exists(settings.YOLO_PLATE_MODEL):
            self.plate_model = YOLO(settings.YOLO_PLATE_MODEL)
            print(f"  ANPR plate model loaded: {settings.YOLO_PLATE_MODEL}")

        try:
            import easyocr
            self.ocr_reader = easyocr.Reader(["en"], gpu=False)
            print("  EasyOCR reader loaded")
        except ImportError:
            print("  Warning: EasyOCR not available")

    def detect_plates(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect and read number plates in a frame."""
        if self.plate_model is None:
            return []

        plates = []
        results = self.plate_model(frame, conf=self.confidence, verbose=False)

        for r in results:
            for box in r.boxes:
                bbox = box.xyxy[0].tolist()
                conf = float(box.conf[0])

                # Crop plate region
                x1, y1, x2, y2 = [int(c) for c in bbox]
                plate_crop = frame[y1:y2, x1:x2]

                # Read plate text with OCR
                plate_text = self._read_plate(plate_crop)

                plates.append({
                    "bbox": bbox,
                    "confidence": conf,
                    "plate_text": plate_text,
                    "plate_image_shape": plate_crop.shape[:2] if plate_crop.size > 0 else (0, 0),
                })

        return plates

    def _read_plate(self, plate_image: np.ndarray) -> str:
        """Extract text from a cropped plate image using OCR."""
        if self.ocr_reader is None or plate_image.size == 0:
            return ""

        try:
            # Preprocess: convert to grayscale, enhance contrast
            gray = cv2.cvtColor(plate_image, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            gray = cv2.GaussianBlur(gray, (3, 3), 0)

            # OCR
            results = self.ocr_reader.readtext(gray)

            if results:
                # Combine all text results
                texts = [r[1] for r in results if r[2] > 0.3]
                plate_text = " ".join(texts).strip().upper()
                # Clean up common OCR errors
                plate_text = self._clean_plate_text(plate_text)
                return plate_text

        except Exception as e:
            print(f"  ANPR OCR error: {e}")

        return ""

    @staticmethod
    def _clean_plate_text(text: str) -> str:
        """Clean OCR output for UK-style number plates."""
        import re
        # Remove non-alphanumeric except spaces
        cleaned = re.sub(r"[^A-Z0-9 ]", "", text)
        # Remove extra spaces
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def match_plate(self, plate_text: str, watchlist: List[str]) -> bool:
        """Check if a detected plate matches any on the watchlist."""
        if not plate_text:
            return False
        normalized = plate_text.replace(" ", "").upper()
        for entry in watchlist:
            if entry.replace(" ", "").upper() == normalized:
                return True
        return False
