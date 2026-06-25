import ast
source = open('app/routes/auth_routes.py', encoding='utf-8').read()
tree = ast.parse(source)
for node in tree.body:
    if isinstance(node, ast.FunctionDef) and node.name == 'impersonate_user':
        print(f'Lines {node.lineno} to {node.end_lineno}')
