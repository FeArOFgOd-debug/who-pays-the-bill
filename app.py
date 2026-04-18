from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# Default friends list
DEFAULT_FRIENDS = ["MANISH", "ANIKET", "LAKSHYA", "PRATEEK", "ARPIT"]


@app.route("/")
def index():
    return render_template("index.html", friends=DEFAULT_FRIENDS)


@app.route("/spin", methods=["POST"])
def spin():
    """Pick a random friend to pay the bill."""
    data = request.get_json()
    friends = data.get("friends", DEFAULT_FRIENDS)

    # Filter out empty strings
    friends = [f.strip() for f in friends if f.strip()]

    if not friends:
        return jsonify({"error": "No friends in the list!"}), 400

    chosen = random.choice(friends)
    return jsonify({"chosen": chosen, "friends": friends})


if __name__ == "__main__":
    app.run(debug=True, port=5000)

    
