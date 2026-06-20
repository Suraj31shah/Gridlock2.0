import math

def get_recommendations(prediction_result, input_data):
    severity = prediction_result.get('severity_label', 'Low')
    duration = prediction_result.get('predicted_duration_hours', 0)
    
    cause = input_data.get('event_cause', '').lower()
    road_closure = str(input_data.get('requires_road_closure', False)).lower() in ['true', '1', 'yes']
    
    severity_multiplier = 2 if severity == 'High' else (1 if severity == 'Medium' else 0)
    base_officers = 1
    
    # ML-driven officer scaling (softer scaling for duration, capped at 10)
    calculated_officers = max(base_officers, math.ceil(duration / 6.0) + severity_multiplier)
    calculated_officers = min(10, calculated_officers)
    
    rec = {
        "officer_count": calculated_officers,
        "equipment": [],
        "urgency": severity,
        "diversion_note": "No diversion required.",
        "expected_clear_time": f"~{math.ceil(duration)} hours"
    }

    if road_closure or severity == 'High':
        rec["equipment"].extend(["Barricades", "Reflective Cones"])
        rec["diversion_note"] = "Activate alternate diversion route and broadcast via FM/Maps."
        
    if cause in ['procession', 'public_event', 'protest']:
        rec["officer_count"] = max(rec["officer_count"], 6)
        if "Barricades" not in rec["equipment"]:
            rec["equipment"].append("Barricades")
        rec["diversion_note"] = "Coordinate with event organizers and alert adjacent junctions."
        
    elif cause == 'construction' and duration > 50:
        rec["equipment"].extend(["Warning Signage", "Blinkers"])
        rec["diversion_note"] = "Long-term construction. Schedule regular patrol rotations."
        
    elif cause == 'accident':
        rec["equipment"].extend(["Ambulance (if casualty)", "Tow Truck"])
        rec["diversion_note"] = "Immediate lane clearing required."
        
    elif cause == 'vehicle_breakdown':
        rec["equipment"].append("Tow Truck")
        
    elif severity == 'Low' and not road_closure:
        rec["diversion_note"] = "Monitor via CCTV. 1 officer on standby."

    # Remove duplicates from equipment
    rec["equipment"] = list(set(rec["equipment"]))
    if not rec["equipment"]:
        rec["equipment"] = ["Standard Patrol Gear"]

    return rec
