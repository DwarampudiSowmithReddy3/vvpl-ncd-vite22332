"""
Kaleyra SMS Service Module
Handles all SMS communication through Kaleyra API v4
"""
import os
import json
import logging
import requests
import urllib.parse
from datetime import datetime
from typing import Tuple, Dict, Optional

logger = logging.getLogger(__name__)


class KaleyraService:
    """
    Kaleyra SMS Service
    Provides clean interface for sending SMS through Kaleyra API
    """
    
    def __init__(self):
        """Initialize Kaleyra service with credentials from environment"""
        self.api_key = os.getenv('KALEYRA_API_KEY')
        self.sender_id = os.getenv('KALEYRA_SENDER_ID')
        self.base_url = os.getenv('KALEYRA_BASE_URL')
        
        # Ensure base_url ends with /
        if not self.base_url.endswith('/'):
            self.base_url += '/'
        
        # Validate credentials
        if not all([self.api_key, self.sender_id]):
            logger.warning("⚠️ Kaleyra credentials not fully configured")
    
    def is_configured(self) -> bool:
        """Check if Kaleyra service is properly configured"""
        return all([self.api_key, self.sender_id])
    
    def _clean_phone_number(self, phone: str) -> str:
        """
        Clean and format phone number
        Returns: Formatted phone number with country code
        """
        # Remove spaces, dashes, parentheses
        phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        # Remove + prefix if present
        if phone.startswith('+'):
            phone = phone[1:]
        
        # Ensure it starts with 91 for India
        if not phone.startswith('91') and len(phone) == 10:
            phone = '91' + phone
        
        return phone
    
    def send_sms(self, phone_number: str, message: str, custom_id: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Send SMS to a single phone number
        
        Args:
            phone_number: Recipient phone number
            message: SMS message content
            custom_id: Optional custom reference ID
        
        Returns:
            Tuple of (success: bool, message_id: str, error: str)
        """
        if not self.is_configured():
            logger.error("❌ Kaleyra service not configured")
            return (False, None, "SMS service not configured")
        
        try:
            # Clean phone number
            phone = self._clean_phone_number(phone_number)
            
            # Prepare JSON data as per Kaleyra v4 documentation
            json_data = {
                "sender": "LNFRNT",
                "message": message,
                "sms": [
                    {
                        "to": phone
                    }
                ]
            }
            
            # Add custom ID if provided
            if custom_id:
                json_data["sms"][0]["custom"] = custom_id
            
            # URL encode the JSON
            json_str = json.dumps(json_data)
            encoded_json = urllib.parse.quote(json_str)
            
            # Build endpoint
            endpoint = f"{self.base_url}?api_key={self.api_key}&method=sms.json&json={encoded_json}"
            
            # Log request (without exposing API key)
            logger.info(f"📤 Sending SMS to {phone}")
            logger.info(f"📤 Message: {message[:50]}...")
            
            # Make API call
            response = requests.post(endpoint, timeout=10)
            
            logger.info(f"📡 Response Status: {response.status_code}")
            logger.info(f"📡 Response: {response.text}")
            
            # Parse response
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'OK':
                    # Extract message ID
                    sms_data = data.get('data', [])
                    if sms_data and len(sms_data) > 0:
                        message_id = sms_data[0].get('id', f"SMS_{datetime.now().timestamp()}")
                        logger.info(f"✅ SMS sent successfully! Message ID: {message_id}")
                        return (True, str(message_id), None)
                    else:
                        message_id = f"SMS_{datetime.now().timestamp()}"
                        return (True, str(message_id), None)
                else:
                    error_msg = data.get('message', 'Unknown error')
                    logger.error(f"❌ Kaleyra API error: {error_msg}")
                    return (False, None, f"API error: {error_msg}")
            else:
                error_text = response.text
                logger.error(f"❌ HTTP error {response.status_code}: {error_text}")
                return (False, None, f"HTTP error: {response.status_code}")
        
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
    
    def send_template_sms(self, phone_number: str, template_id: str, variables: Dict[str, str]) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Send SMS using a template with variable substitution
        
        Args:
            phone_number: Recipient phone number
            template_id: Template identifier
            variables: Dictionary of template variables
        
        Returns:
            Tuple of (success: bool, message_id: str, error: str)
        """
        # TODO: Implement template-based SMS if Kaleyra supports it
        # For now, this is a placeholder for future implementation
        logger.warning("⚠️ Template SMS not yet implemented")
        return (False, None, "Template SMS not implemented")
    
    def send_personalized_bulk_sms(self, recipients_data: list, template_content: str) -> Dict:
        """
        Send personalized SMS to multiple recipients using template with variables
        Each recipient gets their own personalized message
        
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
        
        Returns:
            Dictionary with success/failure counts and details
        """
        if not self.is_configured():
            return {
                "success": False,
                "successful": 0,
                "failed": len(recipients_data),
                "error": "SMS service not configured",
                "details": []
            }
        
        results = {
            "successful": 0,
            "failed": 0,
            "details": []
        }
        
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
                
                # Send personalized SMS
                custom_id = variables.get('custom_id', None)
                success, message_id, error = self.send_sms(phone, personalized_message, custom_id)
                
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


# Global instance
# kaleyra_service = KaleyraService()


# # Convenience functions for direct import
# def send_sms(phone_number: str, message: str, custom_id: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
#     """Send SMS using global Kaleyra service instance"""
#     return kaleyra_service.send_sms(phone_number, message, custom_id)


# def send_template_sms(phone_number: str, template_id: str, variables: Dict[str, str]) -> Tuple[bool, Optional[str], Optional[str]]:
#     """Send template SMS using global Kaleyra service instance"""
#     return kaleyra_service.send_template_sms(phone_number, template_id, variables)


# def send_personalized_bulk_sms(recipients_data: list, template_content: str) -> Dict:
#     """Send personalized bulk SMS using global Kaleyra service instance"""
#     return kaleyra_service.send_personalized_bulk_sms(recipients_data, template_content)


def sending_sms(phone_number, amount, ncd_name):

    # Dummy Kaleyra configuration
    KALEYRA_SID = "HXIN1757793252IN"
    KALEYRA_API_KEY = "Ae0bd3a1c0523fa0b6d7761285f6b2da6"
    KALEYRA_BASE_URL = "https://api.kaleyra.io/v1"
    KALEYRA_SENDER_ID = "LNFRNT"

    # DLT template id (dummy)
    TEMPLATE_ID = "1107177208876038744"

    url = f"{KALEYRA_BASE_URL}/{KALEYRA_SID}/messages"

    headers = {
        "Content-Type": "application/json",
        "api-key": KALEYRA_API_KEY
    }

    # Transactional SMS body
    body_message = f"LoanFront: Please review your Key Fact Statement (KFS) before proceeding. Access securely: https://loanfront.in/launch_app. Valid until 26 Jan 2026."

    payload = {
        "to": f"91{phone_number}",
        "type": "TXN",
        "sender": KALEYRA_SENDER_ID,
        "template_id": TEMPLATE_ID,
        "body": body_message
    }

    try:
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code == 202:
            print("SMS sent successfully")
        else:
            print("SMS failed:", response.text)

        return response.json()

    except Exception as e:
        print("Error sending SMS:", str(e))
        return None


resp = sending_sms(
    phone_number="9063761569",
    amount="50000",
    ncd_name="ABC Finance"
)

print(resp)