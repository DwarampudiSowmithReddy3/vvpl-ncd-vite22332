"""
Mailchimp Transactional Email Service (Mandrill)
================================================
Sends emails via Mailchimp Transactional API (formerly Mandrill)

CRITICAL:
- Uses mailchimp-transactional SDK (NOT mailchimp-marketing)
- mailchimp-marketing is for lists/campaigns only
- mailchimp-transactional is for sending emails
- Sender email must be verified in Mailchimp Transactional settings

All credentials fetched from environment variables (no hardcoding)
"""
import os
import mailchimp_transactional as MailchimpTransactional
from mailchimp_transactional.api_client import ApiClientError
import logging
from typing import Tuple, Optional, Dict, List
import time
logger = logging.getLogger(__name__)


class MailchimpService:
    """Service for sending emails via Mailchimp Transactional (Mandrill)"""
    
    def __init__(self):
        """Initialize Mailchimp Transactional client with API key from environment"""
        try:
            self.api_key = os.getenv('MAILCHIMP_API_KEY')
            self.from_email = os.getenv('MAILCHIMP_FROM_EMAIL')
            self.from_name = os.getenv('MAILCHIMP_FROM_NAME', 'NCD Management System')
            
            # Validate configuration
            if not all([self.api_key, self.from_email]):
                logger.warning("⚠️ Mailchimp Transactional configuration incomplete")
                logger.warning("   Required: MAILCHIMP_API_KEY, MAILCHIMP_FROM_EMAIL")
                logger.warning("   CRITICAL: API key must be Mailchimp TRANSACTIONAL (Mandrill), not Marketing API")
                self.configured = False
                return
            
            # Initialize Mailchimp Transactional client
            # IMPORTANT: Transactional API only needs API key, no server needed
            self.client = MailchimpTransactional.Client(self.api_key)
            
            self.configured = True
            logger.info("✅ Mailchimp Transactional service initialized successfully")
            logger.info(f"   From Email: {self.from_email}")
            logger.info("   ⚠️  Ensure API key is Mailchimp TRANSACTIONAL (Mandrill), not Marketing API")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Mailchimp Transactional service: {e}")
            logger.error("   Check that MAILCHIMP_API_KEY is a valid Transactional (Mandrill) key")
            self.configured = False
    
    def send_email(self, to_email: str, subject: str, html_content: str, 
                   text_content: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Send a single email via Mailchimp Transactional (Mandrill)
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text email content (optional)
        
        Returns:
            Tuple of (success: bool, message_id: str, error: str)
        
        Common Issues:
        - "Mailchimp service not configured" → Check .env file has all required variables
        - "API error" → API key might be Marketing API, not Transactional (Mandrill)
        - "Email rejected" → Sender email not verified in Mailchimp Transactional settings
        """
        try:
            if not self.configured:
                logger.error("❌ Mailchimp Transactional service not configured")
                logger.error("   Check .env file has: MAILCHIMP_API_KEY, MAILCHIMP_FROM_EMAIL")
                logger.error("   CRITICAL: API key must be Mailchimp TRANSACTIONAL (Mandrill), not Marketing API")
                return (False, None, "Mailchimp Transactional service not configured")
            
            logger.info(f"📤 Sending email to {to_email}")
            logger.info(f"📤 Subject: {subject}")
            
            # Prepare email message for Transactional API
            # IMPORTANT: Payload must be wrapped in {"message": {...}}
            message = {
                "from_email": self.from_email,
                "from_name": self.from_name,
                "subject": subject,
                "html": html_content,
                "text": text_content or "",
                "tags": ["ncd-investor-notification"],  # Tag for analytics in Mailchimp dashboard
                "to": [
                    {
                        "email": to_email,
                        "type": "to"
                    }
                ]
            }
            
            # Send via Mailchimp Transactional API
            # CRITICAL: Wrap message in {"message": message}
            response = self.client.messages.send({"message": message})
            
            logger.info(f"📡 Response: {response}")
            
            # Check if email was sent successfully
            if response and len(response) > 0:
                result = response[0]
                
                if result.get('status') == 'sent':
                    message_id = result.get('_id', f"MAILCHIMP_{result.get('email', 'unknown')}")
                    logger.info(f"✅ Email sent successfully! Message ID: {message_id}")
                    return (True, message_id, None)
                else:
                    error_msg = result.get('reject_reason', 'Unknown error')
                    logger.error(f"❌ Email rejected: {error_msg}")
                    logger.error("   Check: Sender email verified? Transactional email enabled?")
                    return (False, None, f"Email rejected: {error_msg}")
            else:
                logger.error("❌ No response from Mailchimp Transactional")
                return (False, None, "No response from Mailchimp Transactional")
        
        except ApiClientError as e:
            logger.error(f"❌ Mailchimp Transactional API error: {e}")
            logger.error("   CRITICAL: Check if API key is Transactional (Mandrill), not Marketing API")
            return (False, None, f"Mailchimp Transactional API error: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error sending email: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return (False, None, str(e))
    
    def send_bulk_emails(self, recipients: List[Dict], subject: str, 
                        html_content: str, text_content: Optional[str] = None) -> Dict:
        """
        Send emails to multiple recipients in batches (optimized for 1000+ emails)
        
        Uses batching to send multiple recipients in ONE API call instead of individual calls.
        Batch size: 50 recipients per API call (Mailchimp limit is higher, but 50 is safe)
        Rate limiting: 100ms delay between batches to prevent throttling
        
        Supports per-recipient personalization via merge_vars:
        recipients = [
            {
                'email': 'user@example.com',
                'name': 'John Doe',
                'merge_vars': {
                    'InvestorName': 'John Doe',
                    'Amount': '₹100,000'
                }
            }
        ]
        
        Args:
            recipients: List of dicts with 'email', 'name', and optional 'merge_vars' keys
            subject: Email subject
            html_content: HTML email content (can use *|VARIABLE|* for merge vars)
            text_content: Plain text email content (optional)
        
        Returns:
            Dict with success/failure counts and details
        """
        results = {
            "successful": 0,
            "failed": 0,
            "details": []
        }
        
        logger.info(f"� Starting bulk email to {len(recipients)} recipients (batched)")
        
        # Batch size: 50 recipients per API call
        BATCH_SIZE = 50
        # Rate limiting: 100ms delay between batches
        BATCH_DELAY = 0.1
        
        # Split recipients into batches
        for batch_num, batch_start in enumerate(range(0, len(recipients), BATCH_SIZE)):
            batch_end = min(batch_start + BATCH_SIZE, len(recipients))
            batch = recipients[batch_start:batch_end]
            
            logger.info(f"📦 Processing batch {batch_num + 1}: recipients {batch_start + 1}-{batch_end}")
            
            try:
                # Build recipient list for this batch
                to_list = []
                batch_details = []
                
                for recipient in batch:
                    email = recipient.get('email')
                    name = recipient.get('name', 'Investor')
                    merge_vars = recipient.get('merge_vars', {})
                    
                    if not email:
                        results["failed"] += 1
                        results["details"].append({
                            "email": "N/A",
                            "name": name,
                            "status": "failed",
                            "error": "Email address missing"
                        })
                        continue
                    
                    # Build recipient with merge variables for personalization
                    recipient_obj = {
                        "email": email,
                        "name": name,
                        "type": "to"
                    }
                    
                    # Add merge variables if provided
                    if merge_vars:
                        recipient_obj["merge_vars"] = [
                            {"name": key, "content": str(value)}
                            for key, value in merge_vars.items()
                        ]
                    
                    to_list.append(recipient_obj)
                    batch_details.append((email, name))
                
                if not to_list:
                    logger.warning(f"⚠️ Batch {batch_num + 1} has no valid emails")
                    continue
                
                # Send batch in ONE API call
                message = {
                    "from_email": self.from_email,
                    "from_name": self.from_name,
                    "subject": subject,
                    "html": html_content,
                    "text": text_content or "",
                    "tags": ["ncd-investor-notification"],  # Tag for analytics in Mailchimp dashboard
                    "to": to_list
                }
                
                logger.info(f"📤 Sending batch with {len(to_list)} recipients in ONE API call")
                response = self.client.messages.send({"message": message})
                
                logger.info(f"📡 Batch response: {len(response)} results")
                
                # Process batch response
                if response and len(response) > 0:
                    for idx, result in enumerate(response):
                        email = result.get('email', 'unknown')
                        status = result.get('status', 'unknown')
                        
                        if status == 'sent':
                            message_id = result.get('_id', f"MAILCHIMP_{email}")
                            results["successful"] += 1
                            results["details"].append({
                                "email": email,
                                "name": batch_details[idx][1] if idx < len(batch_details) else 'Unknown',
                                "status": "success",
                                "message_id": message_id
                            })
                            logger.info(f"✅ Email sent to {email}")
                        else:
                            error_msg = result.get('reject_reason', 'Unknown error')
                            results["failed"] += 1
                            results["details"].append({
                                "email": email,
                                "name": batch_details[idx][1] if idx < len(batch_details) else 'Unknown',
                                "status": "failed",
                                "error": error_msg
                            })
                            logger.warning(f"⚠️ Email rejected for {email}: {error_msg}")
                else:
                    logger.error(f"❌ No response from Mailchimp for batch")
                    for email, name in batch_details:
                        results["failed"] += 1
                        results["details"].append({
                            "email": email,
                            "name": name,
                            "status": "failed",
                            "error": "No response from Mailchimp"
                        })
                
                # Rate limiting: Add delay between batches to prevent throttling
                if batch_end < len(recipients):
                    logger.info(f"⏳ Rate limiting: waiting {BATCH_DELAY}s before next batch")
                    time.sleep(BATCH_DELAY)
            
            except ApiClientError as e:
                logger.error(f"❌ Mailchimp API error in batch: {e}")
                for email, name in batch_details:
                    results["failed"] += 1
                    results["details"].append({
                        "email": email,
                        "name": name,
                        "status": "failed",
                        "error": f"Mailchimp API error: {str(e)}"
                    })
            
            except Exception as e:
                logger.error(f"❌ Error processing batch: {e}")
                import traceback
                logger.error(traceback.format_exc())
                for email, name in batch_details:
                    results["failed"] += 1
                    results["details"].append({
                        "email": email,
                        "name": name,
                        "status": "failed",
                        "error": str(e)
                    })
        
        logger.info(f"📊 Bulk email completed: {results['successful']} successful, {results['failed']} failed")
        return results
