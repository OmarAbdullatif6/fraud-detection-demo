"""
Pydantic Schema Definitions for Fraud Detection AI Backend
Matches exactly the features from fraudTest.csv
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class TransactionFeatures(BaseModel):
    trans_date_trans_time: Optional[str] = Field(None, description="Transaction timestamp YYYY-MM-DD HH:MM:SS")
    cc_num: Optional[str] = Field(None, description="Credit card number")
    merchant: str = Field(..., description="Merchant name, e.g. fraud_Kirlin and Sons")
    category: str = Field(..., description="Transaction category (entertainment, food_dining, travel, etc.)")
    amt: float = Field(..., gt=0, description="Transaction amount in USD")
    first: Optional[str] = Field("", description="Cardholder first name")
    last: Optional[str] = Field("", description="Cardholder last name")
    gender: Optional[str] = Field("M", description="Gender (M / F)")
    street: Optional[str] = Field("", description="Cardholder street address")
    city: Optional[str] = Field("", description="City")
    state: Optional[str] = Field("", description="2-letter state code")
    zip: Optional[str] = Field("", description="Zip code")
    lat: float = Field(..., description="Cardholder latitude")
    long: float = Field(..., description="Cardholder longitude")
    city_pop: Optional[int] = Field(10000, description="City population")
    job: Optional[str] = Field("", description="Cardholder occupation")
    dob: Optional[str] = Field("", description="Date of birth YYYY-MM-DD")
    trans_num: Optional[str] = Field(None, description="Unique transaction reference ID")
    unix_time: Optional[int] = Field(None, description="Unix timestamp")
    merch_lat: float = Field(..., description="Merchant latitude")
    merch_long: float = Field(..., description="Merchant longitude")


class RiskFactor(BaseModel):
    factor: str
    impact: str
    severity: str  # "high", "medium", "low"


class PredictionResponse(BaseModel):
    is_fraud: int = Field(..., description="1 for fraud, 0 for legitimate")
    fraud_probability: float = Field(..., description="Probability of fraud [0.0 - 1.0]")
    risk_score: float = Field(..., description="Scaled score [0 - 100]")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    decision: str = Field(..., description="APPROVE, REVIEW, or BLOCK")
    distance_km: float = Field(..., description="Calculated cardholder to merchant distance")
    cardholder_age: Optional[int] = Field(None, description="Cardholder age derived from DOB")
    explanation: List[RiskFactor] = Field(default_factory=list)
    latency_ms: float = Field(..., description="Inference latency in milliseconds")


class BatchPredictionRequest(BaseModel):
    transactions: List[TransactionFeatures]


class BatchPredictionResponse(BaseModel):
    total_processed: int
    fraud_detected: int
    fraud_rate_percent: float
    total_amount_flagged: float
    results: List[PredictionResponse]
