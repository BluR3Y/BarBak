from flask import Flask,jsonify, request

app = Flask(__name__)

@app.route('/')
def home_route():
    return jsonify(message="Hello, World!")

@app.route('/testget', methods=["GET"])
def test_get():
    return jsonify(message='Test Get')

@app.route('/testpost', methods=["POST"])
def test_post():
    return jsonify(message='Test POST')

if __name__ == '__main__':
    app.run(debug=True)
