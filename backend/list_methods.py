import ast
source = open('app/models/attendance_model.py', encoding='utf-8').read()
tree = ast.parse(source)
cls = [n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'AttendanceModel'][0]
for node in cls.body:
    if isinstance(node, ast.FunctionDef):
        print(f"{node.name} (Lines {node.lineno} to {node.end_lineno})")
