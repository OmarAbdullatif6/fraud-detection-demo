import urllib.request
import json

def test_api():
    # 1. Health check
    with urllib.request.urlopen('http://localhost:8000/api/health') as resp:
        data = json.loads(resp.read().decode())
        print('Health Check Status:', resp.status)
        print('Health Response:', json.dumps(data, indent=2))

    # 2. Prediction request with real travel anomaly
    sample_req = {
        'trans_date_trans_time': '2020-06-21 02:45:19',
        'cc_num': '3560725013359375',
        'merchant': "fraud_Hamill-D'Amore",
        'category': 'travel',
        'amt': 894.25,
        'first': 'Brooke',
        'last': 'Smith',
        'gender': 'F',
        'street': '63542 Luna Brook Apt. 012',
        'city': 'Notrees',
        'state': 'TX',
        'zip': '79759',
        'lat': 31.8599,
        'long': -102.7413,
        'city_pop': 23,
        'job': 'Cytogeneticist',
        'dob': '1969-09-15',
        'merch_lat': 41.8781,
        'merch_long': -87.6298
    }

    req = urllib.request.Request(
        'http://localhost:8000/api/predict',
        data=json.dumps(sample_req).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        print('\nPrediction HTTP Status:', resp.status)
        print('Risk Score:', res['risk_score'])
        print('Decision:', res['decision'])
        print('Fraud Probability:', res['fraud_probability'])
        print('Explanation:', json.dumps(res['explanation'], indent=2))
        print('Model Diagnostics:', json.dumps(res['model_diagnostics'], indent=2))
        print(f"Latency: {res['latency_ms']} ms")

if __name__ == '__main__':
    test_api()
