import os


def replace_terms():
    terms = {"עובד": "שוטר", "עובדים": "שוטרים", "משרת": "שוטר", "משרתים": "שוטרים"}

    # Exclude certain files or areas if needed
    # (Optional: check if the match is inside a string or JSX)

    base_dir = r"c:\Users\nafta\OneDrive\שולחן העבודה\mishmarot"
    target_dirs = [
        os.path.join(base_dir, "frontend", "src"),
        os.path.join(base_dir, "backend", "app", "routes"),
        os.path.join(base_dir, "backend", "app", "models"),
    ]

    for directory in target_dirs:
        if not os.path.exists(directory):
            print(f"Directory {directory} does not exist. Skipping.")
            continue

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith((".tsx", ".ts", ".py")):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()

                        original_content = content

                        # Sort keys by length descending to avoid partial matches (e.g., 'עובדים' before 'עובד')
                        for old in sorted(terms.keys(), key=len, reverse=True):
                            content = content.replace(old, terms[old])

                        if content != original_content:
                            with open(file_path, "w", encoding="utf-8") as f:
                                f.write(content)
                            print(f"✅ Updated {file_path}")
                    except Exception as e:
                        print(f"❌ Error updating {file_path}: {e}")


if __name__ == "__main__":
    replace_terms()
