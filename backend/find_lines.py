import ast
source = open('app/models/attendance_model.py', encoding='utf-8').read()
tree = ast.parse(source)
cls = [n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'AttendanceModel'][0]
func = [n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == 'get_unit_comparison_stats'][0]
print(f'Lines {func.lineno} to {func.end_lineno}')
