from app import create_app

app = create_app()


@app.route("/favicon.ico")
def favicon():
    return "", 204


if __name__ == "__main__":
    # הרצת השרת במצב דיבאג
    app.run(debug=True, port=5000)
