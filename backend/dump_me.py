import ast
source = open('app/routes/auth_routes.py', encoding='utf-8').read()
tree = ast.parse(source)
for node in tree.body:
    if isinstance(node, ast.FunctionDef) and getattr(node, 'name', '') == 'get_me':
        print(f"Lines: {node.lineno} to {node.end_lineno}")
        lines = source.split('\n')[node.lineno-2:node.end_lineno]
        print('\n'.join(lines))
