"""
Kaleyra SMS Service - Simple & Working
Uses Kaleyra API v1 for sending SMS
"""
import os
import requests
import logging
from typing import Tuple, Dict, List, Optional

logger = logging.getLogger(__name__)


def send_single_sms(phone_number: str, message: str, template_id: str, message_type_code: str = 'TXN') -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Send SMS to a single phone number using Kaleyra API v1
    
    Args:
        phone_number: Phone number (10 digits, will be prefixed with 91)
        message: SMS message content
        template_id: DLT Template ID from Kaleyra
        message_type_code: DLT message type code (TXN, PRM, OTP, ALR, SRV)
    
    Returns:
        Tuple of (success: bool, message_id: str, error: str)
    
    Example:
        success, msg_id, error = send_single_sms("9063761569", "Hello!", "11071087644255876038744", "TXN")
    """
    try:
        # Get Kaleyra configuration from environment
        KALEYRA_SID = os.getenv('KALEYRA_SID')
        KALEYRA_API_KEY = os.getenv('KALEYRA_API_KEY')
        KALEYRA_BASE_URL = os.getenv('KALEYRA_BASE_URL')
        KALEYRA_SENDER_ID = os.getenv('KALEYRA_SENDER_ID')
        
        # Validate configuration
        if not all([KALEYRA_SID, KALEYRA_API_KEY, KALEYRA_BASE_URL, KALEYRA_SENDER_ID]):
            logger.error("❌ Kaleyra configuration missing in .env file")
            return (False, None, "Kaleyra configuration missing")
        
        # Clean phone number (remove spaces, dashes, etc.)
        phone = phone_number.replace(' ', '').replace('-', '').replace('+', '')
        
        # Add 91 prefix if not present
        if not phone.startswith('91') and len(phone) == 10:
            phone = '91' + phone
        
        # Build API URL
        url = f"{KALEYRA_BASE_URL}/{KALEYRA_SID}/messages"
        
        # Build headers
        headers = {
            "Content-Type": "application/json",
            "api-key": KALEYRA_API_KEY
        }
        
        # Build payload
        payload = {
            "to": phone,
            "type": message_type_code,  # Use the provided message type code (TXN, PRM, OTP, ALR, SRV)
            "sender": KALEYRA_SENDER_ID,
            "template_id": template_id,
            "body": message
        }
        
        # Log request (without exposing API key)
        logger.info(f"📤 Sending SMS to {phone}")
        logger.info(f"📤 Message Type: {message_type_code}")
        logger.info(f"📤 Template ID: {template_id}")
        logger.info(f"📤 Message: {message[:50]}...")
        
        # Make API call
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        logger.info(f"📡 Response Status: {response.status_code}")
        logger.info(f"📡 Response: {response.text}")
        
        # Check response
        if response.status_code == 202:
            # Parse response
            data = response.json()
            
            # Extract message ID
            if 'id' in data and data.get('data'):
                message_id = data['data'][0].get('message_id', data.get('id'))
                logger.info(f"✅ SMS sent successfully! Message ID: {message_id}")
                return (True, message_id, None)
            else:
                logger.warning("⚠️ SMS accepted but no message ID returned")
                return (True, data.get('id', 'UNKNOWN'), None)
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}"
            logger.error(f"❌ SMS failed: {error_msg}")
            return (False, None, error_msg)
    
    except requests.exceptions.Timeout:
        logger.error(f"❌ SMS timeout for {phone_number}")
        return (False, None, "Request timeout")
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Network error: {e}")
        return (False, None, f"Network error: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return (False, None, str(e))


def send_bulk_sms(recipients_data: List[Dict], template_content: str, template_id: str, message_type_code: str = 'TXN') -> Dict:
    """
    Send personalized SMS to multiple recipients
    
    Args:
        recipients_data: List of dicts with recipient info and variables
            Example: [
                {
                    'phone': '9876543210',
                    'variables': {
                        'investor_name': 'John Doe',
                        'amount': '100000',
                        'series_name': 'NCD-2024-A'
                    }
                },
                ...
            ]
        template_content: Template string with {variable} placeholders
        template_id: DLT Template ID from Kaleyra
        message_type_code: DLT message type code (TXN, PRM, OTP, ALR, SRV)
    
    Returns:
        Dictionary with success/failure counts and details
    
    Example:
        results = send_bulk_sms(recipients, "Hello {investor_name}!", "1107177208876038744", "TXN")
    """
    results = {
        "successful": 0,
        "failed": 0,
        "details": []
    }
    
    logger.info(f"📤 Starting bulk SMS to {len(recipients_data)} recipients")
    
    for recipient in recipients_data:
        try:
            phone = recipient.get('phone')
            variables = recipient.get('variables', {})
            
            if not phone:
                results["failed"] += 1
                results["details"].append({
                    "phone": "N/A",
                    "status": "failed",
                    "error": "Phone number missing"
                })
                continue
            
            # Personalize message for this recipient
            personalized_message = template_content
            for key, value in variables.items():
                placeholder = f"{{{key}}}"
                personalized_message = personalized_message.replace(placeholder, str(value))
            
            # Send SMS
            success, message_id, error = send_single_sms(phone, personalized_message, template_id, message_type_code)
            
            if success:
                results["successful"] += 1
                results["details"].append({
                    "phone": phone,
                    "status": "success",
                    "message_id": message_id,
                    "investor_name": variables.get('investor_name', 'N/A')
                })
            else:
                results["failed"] += 1
                results["details"].append({
                    "phone": phone,
                    "status": "failed",
                    "error": error,
                    "investor_name": variables.get('investor_name', 'N/A')
                })
        
        except Exception as e:
            logger.error(f"❌ Error sending to {recipient.get('phone', 'unknown')}: {e}")
            results["failed"] += 1
            results["details"].append({
                "phone": recipient.get('phone', 'unknown'),
                "status": "failed",
                "error": str(e)
            })
    
    logger.info(f"📊 Bulk SMS completed: {results['successful']} successful, {results['failed']} failed")
    return results


