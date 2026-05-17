from app.models.feedback_model import FeedbackModel
from run import app

with app.app_context():
    try:
        res = FeedbackModel.create_feedback({
            'user_id': 1,
            'category': 'test',
            'description': 'Testing from console script',
            'context_page': 'test_page'
        })
        print(f"Result ID: {res}")
    except Exception as e:
        print(f"Error: {e}")
