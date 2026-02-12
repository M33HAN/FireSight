"""
FireSight — IoU-Based Object Tracker
Tracks detected objects across frames using Intersection over Union.
"""

import numpy as np
from typing import List, Dict, Any


class IoUTracker:
    """Simple IoU-based multi-object tracker."""

    def __init__(self, iou_threshold: float = 0.3, max_lost: int = 30):
        self.iou_threshold = iou_threshold
        self.max_lost = max_lost
        self.tracks = {}
        self.next_id = 1

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Update tracks with new detections and assign track IDs."""
        if not detections:
            self._increment_lost()
            return []

        # Extract bboxes from detections
        det_bboxes = [d["bbox"] for d in detections]

        if not self.tracks:
            # Initialize tracks
            for i, det in enumerate(detections):
                track_id = f"T{self.next_id:04d}"
                self.next_id += 1
                det["track_id"] = track_id
                self.tracks[track_id] = {
                    "bbox": det["bbox"],
                    "lost_frames": 0,
                    "category": det["category"],
                }
            return detections

        # Compute IoU matrix
        track_ids = list(self.tracks.keys())
        track_bboxes = [self.tracks[t]["bbox"] for t in track_ids]
        iou_matrix = self._compute_iou_matrix(track_bboxes, det_bboxes)

        # Greedy assignment
        assigned_tracks = set()
        assigned_dets = set()

        while True:
            if iou_matrix.size == 0:
                break
            max_idx = np.unravel_index(iou_matrix.argmax(), iou_matrix.shape)
            max_iou = iou_matrix[max_idx]

            if max_iou < self.iou_threshold:
                break

            t_idx, d_idx = max_idx
            track_id = track_ids[t_idx]
            detections[d_idx]["track_id"] = track_id
            self.tracks[track_id]["bbox"] = detections[d_idx]["bbox"]
            self.tracks[track_id]["lost_frames"] = 0

            assigned_tracks.add(t_idx)
            assigned_dets.add(d_idx)
            iou_matrix[t_idx, :] = -1
            iou_matrix[:, d_idx] = -1

        # Create new tracks for unassigned detections
        for i, det in enumerate(detections):
            if i not in assigned_dets:
                track_id = f"T{self.next_id:04d}"
                self.next_id += 1
                det["track_id"] = track_id
                self.tracks[track_id] = {
                    "bbox": det["bbox"],
                    "lost_frames": 0,
                    "category": det["category"],
                }

        self._increment_lost(assigned_tracks, track_ids)
        return detections

    def _compute_iou_matrix(self, boxes_a, boxes_b):
        """Compute IoU between two sets of bounding boxes."""
        a = np.array(boxes_a)
        b = np.array(boxes_b)

        if len(a) == 0 or len(b) == 0:
            return np.array([])

        iou_matrix = np.zeros((len(a), len(b)))
        for i in range(len(a)):
            for j in range(len(b)):
                iou_matrix[i, j] = self._iou(a[i], b[j])
        return iou_matrix

    @staticmethod
    def _iou(box_a, box_b):
        """Compute IoU between two boxes [x1, y1, x2, y2]."""
        x1 = max(box_a[0], box_b[0])
        y1 = max(box_a[1], box_b[1])
        x2 = min(box_a[2], box_b[2])
        y2 = min(box_a[3], box_b[3])

        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
        area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
        union = area_a + area_b - intersection

        return intersection / union if union > 0 else 0

    def _increment_lost(self, assigned=None, track_ids=None):
        """Increment lost frame count and remove stale tracks."""
        to_remove = []
        for track_id, track in self.tracks.items():
            if assigned and track_ids:
                idx = track_ids.index(track_id) if track_id in track_ids else -1
                if idx >= 0 and idx not in assigned:
                    track["lost_frames"] += 1
            else:
                track["lost_frames"] += 1

            if track["lost_frames"] > self.max_lost:
                to_remove.append(track_id)

        for tid in to_remove:
            del self.tracks[tid]
