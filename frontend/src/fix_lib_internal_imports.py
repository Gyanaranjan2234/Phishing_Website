import os
import re

lib_dir = r"c:\Users\gyana\OneDrive\Desktop\Phishing_Website\frontend\src\lib"
subfolders = ["api", "logic", "services", "utils", "report", "types"]

# Map of filename to its new subfolder
file_to_folder = {
    "api-backend.ts": "api",
    "api-vt.ts": "api",
    "virustotal.ts": "api",
    "riskDecisionLogic.ts": "logic",
    "mapVTResult.ts": "logic",
    "vtMapper.ts": "logic",
    "guestAccess.ts": "services",
    "scanHistory.ts": "services",
    "securityQuiz.ts": "services",
    "fileUtils.ts": "utils",
    "utils.ts": "utils",
    "scrollActiveSectionTracker.ts": "utils",
    "interfaces.ts": "types",
    "vt-interfaces.ts": "types",
    "pdfReportGenerator.ts": "report"
}

# Base names for searching in imports
base_names = [f.replace(".ts", "").replace(".tsx", "") for f in file_to_folder.keys()]

def fix_imports(file_path, current_folder):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content
    
    # 1. Fix relative imports like from './api-backend' to '../api/api-backend'
    for filename, target_folder in file_to_folder.items():
        base = filename.replace(".ts", "").replace(".tsx", "")
        
        # Relative import pattern: from './base' or from "../base"
        patterns = [
            (f"from './{base}'", f"from '../{target_folder}/{base}'"),
            (f"from \"./{base}\"", f"from \"../{target_folder}/{base}\""),
            (f"from '../{base}'", f"from '../{target_folder}/{base}'"), # In case it was already partially fixed
            (f"from \"../{base}\"", f"from \"../{target_folder}/{base}\"")
        ]
        
        for old, new in patterns:
            # If current_folder == target_folder, it should stay './' (but without the extra folder)
            if current_folder == target_folder:
                actual_new = old # No change needed for sibling imports in same folder
            else:
                actual_new = new
            
            new_content = new_content.replace(old, actual_new)

    # 2. Fix cases where we already have '../types/interfaces' but maybe it needs to be different?
    # Actually ../types/interfaces is generally correct from any 1-level deep subfolder.

    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    return False

count = 0
for folder in subfolders:
    folder_path = os.path.join(lib_dir, folder)
    if not os.path.exists(folder_path): continue
    for file in os.listdir(folder_path):
        if file.endswith(".ts") or file.endswith(".tsx"):
            if fix_imports(os.path.join(folder_path, file), folder):
                count += 1

print(f"Updated {count} files inside lib/ subfolders.")
