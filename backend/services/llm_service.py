import google.generativeai as genai
from config import config
import json
import logging
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMServiceError(Exception):
    """Custom exception for LLM service errors"""
    pass

class LLMService:
    """
    Service to handle interactions with the Gemini LLM API
    """
    
    def __init__(self):
        """
        Initialize the LLM service with configuration
        """
        try:
            genai.configure(api_key=config['GEMINI_API_KEY'])
            self.model_name = config['MODEL_NAME']
            self.max_tokens = config['MAX_TOKENS']
            self.temperature = config['TEMPERATURE']
            logger.info("LLM service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {str(e)}")
            raise LLMServiceError("Failed to initialize LLM service")

    def generate_recommendations(self, user_preferences, browsing_history, all_products):
        """
        Generate personalized product recommendations based on user preferences and browsing history
        """
        try:
            # Get browsed products details
            browsed_products = []
            for product_id in browsing_history:
                for product in all_products:
                    if product["id"] == product_id:
                        browsed_products.append(product)
                        break

            # Create prompt
            prompt = self._create_recommendation_prompt(user_preferences, browsed_products, all_products)

            try:
                model = genai.GenerativeModel(model_name=self.model_name)
                chat = model.start_chat()
                
                # Add system message for better context
                chat.send_message("You are an expert e-commerce product recommendation system. Your task is to analyze user preferences and browsing history to provide personalized product recommendations.")
                
                # Send the main prompt
                response = chat.send_message(prompt)
                llm_response = response.text
                
                # Parse and validate recommendations
                recommendations = self._parse_recommendation_response(llm_response, all_products)
                
                # Validate recommendation count
                if not recommendations.get('recommendations'):
                    logger.warning("No recommendations generated")
                    return {
                        "recommendations": [],
                        "error": "No recommendations could be generated"
                    }
                
                logger.info(f"Successfully generated {len(recommendations['recommendations'])} recommendations")
                return recommendations

            except Exception as e:
                logger.error(f"Error calling Gemini API: {str(e)}")
                raise LLMServiceError(f"Failed to generate recommendations: {str(e)}")

        except Exception as e:
            logger.error(f"Error in recommendation generation: {str(e)}")
            raise LLMServiceError(f"Failed to generate recommendations: {str(e)}")

    def _create_recommendation_prompt(self, user_preferences, browsed_products, all_products):
        """
        Create a prompt for the LLM to generate recommendations
        
        Parameters:
        - user_preferences (dict): User's stated preferences
        - browsed_products (list): Products the user has viewed
        - all_products (list): Full product catalog
        
        Returns:
        - str: Prompt for the LLM
        """
        try:
            # Create a structured prompt that guides the LLM to provide relevant recommendations
            prompt = """Based on the following user preferences and browsing history, recommend 5 products from the catalog with explanations.

User Preferences:
{preferences}

Recently Viewed Products:
{browsed_products}

Available Products:
{available_products}

Please analyze the above information and recommend 5 products that best match the user's preferences and browsing patterns. Consider the following factors:
1. Direct matches with user preferences (category, price range, brand)
2. Similar products to those in browsing history
3. Complementary products based on browsing patterns
4. Popular products in preferred categories
5. Price range alignment with preferences

For each recommendation:
1. Provide a clear explanation of why the product is recommended
2. Reference specific user preferences or browsing patterns that influenced the recommendation
3. Consider product ratings and popularity
4. Ensure diversity in recommendations while maintaining relevance

Format your response as a JSON array with the following structure:
[
    {{
        "product_id": "string",
        "explanation": "string",
        "score": number,
        "reasoning": {{
            "preference_match": "string",
            "browsing_pattern": "string",
            "complementary_factor": "string"
        }}
    }}
]

Focus on providing diverse but relevant recommendations that match the user's interests."""

            # Format the preferences section
            preferences_text = "\n".join([f"- {key}: {value}" for key, value in user_preferences.items()])
            
            # Format the browsing history section
            browsed_text = "\n".join([
                f"- {p['name']} (Category: {p['category']}, Price: ${p['price']}, Brand: {p['brand']})"
                for p in browsed_products
            ])
            
            # Get relevant products based on preferences
            relevant_products = self._get_relevant_products(all_products, user_preferences)
            
            # Format the available products section (limit to 20 products to avoid token limits)
            available_text = "\n".join([
                f"- {p['name']} (ID: {p['id']}, Category: {p['category']}, Price: ${p['price']}, Brand: {p['brand']}, Rating: {p['rating']})"
                for p in relevant_products[:20]
            ])
            
            # Fill in the prompt template
            prompt = prompt.format(
                preferences=preferences_text,
                browsed_products=browsed_text,
                available_products=available_text
            )
            
            logger.debug("Successfully created recommendation prompt")
            return prompt
            
        except Exception as e:
            logger.error(f"Error creating recommendation prompt: {str(e)}")
            raise LLMServiceError(f"Failed to create recommendation prompt: {str(e)}")

    def _get_relevant_products(self, products, preferences):
        """
        Sort products by relevance to user preferences
        
        Parameters:
        - products (list): List of all products
        - preferences (dict): User preferences
        
        Returns:
        - list: Sorted products by relevance
        """
        try:
            def relevance_score(product):
                score = 0
                
                # Category match
                if preferences.get('categories') and product['category'] in preferences['categories']:
                    score += 3
                
                # Brand match
                if preferences.get('brands') and product['brand'] in preferences['brands']:
                    score += 2
                
                # Price range match
                if preferences.get('priceRange') and preferences['priceRange'] != 'all':
                    min_price, max_price = map(float, preferences['priceRange'].split('-'))
                    if min_price <= product['price'] <= max_price:
                        score += 2
                
                # Add rating to score
                score += product.get('rating', 0)
                
                return score
            
            # Sort products by relevance score
            sorted_products = sorted(products, key=relevance_score, reverse=True)
            logger.debug(f"Sorted {len(sorted_products)} products by relevance")
            return sorted_products
            
        except Exception as e:
            logger.error(f"Error sorting products by relevance: {str(e)}")
            return products  # Return unsorted products as fallback

    def _parse_recommendation_response(self, llm_response, all_products):
        """
        Parse the LLM response to extract product recommendations
        
        Parameters:
        - llm_response (str): Raw response from the LLM
        - all_products (list): Full product catalog to match IDs with full product info
        
        Returns:
        - dict: Structured recommendations
        """
        try:
            # Find JSON content in the response
            start_idx = llm_response.find('[')
            end_idx = llm_response.rfind(']') + 1
            
            if start_idx == -1 or end_idx == 0:
                logger.warning("Could not find JSON array in LLM response")
                return {
                    "recommendations": [],
                    "error": "Could not parse recommendations from LLM response"
                }
            
            json_str = llm_response[start_idx:end_idx]
            rec_data = json.loads(json_str)
            
            # Enrich recommendations with full product details
            recommendations = []
            for rec in rec_data:
                product_id = rec.get('product_id')
                product_details = None
                
                # Find the full product details
                for product in all_products:
                    if product['id'] == product_id:
                        product_details = product
                        break
                
                if product_details:
                    recommendations.append({
                        "product": product_details,
                        "explanation": rec.get('explanation', ''),
                        "confidence_score": rec.get('score', 5),
                        "reasoning": rec.get('reasoning', {})
                    })
            
            logger.info(f"Successfully parsed {len(recommendations)} recommendations")
            return {
                "recommendations": recommendations,
                "count": len(recommendations)
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON from LLM response: {str(e)}")
            return {
                "recommendations": [],
                "error": "Failed to parse recommendations: Invalid JSON response"
            }
        except Exception as e:
            logger.error(f"Error parsing LLM response: {str(e)}")
            return {
                "recommendations": [],
                "error": f"Failed to parse recommendations: {str(e)}"
            }