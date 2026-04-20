"""
Security Utilities
==================
This file contains password hashing and verification functions.
We use bcrypt for secure password storage.
"""

from passlib.context import CryptContext

# Create a password hashing context using bcrypt
# "bcrypt" is a secure hashing algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password (str): The plain text password to hash
        
    Returns:
        str: The hashed password (bcrypt hash string)
        
    Example:
        >>> hash_password("mysecret123")
        '$2b$12$EixZaYVK1fsbw1ZfbX3OXe...'
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify if a plain text password matches the hashed password.
    
    Args:
        plain_password (str): The plain text password to check
        hashed_password (str): The bcrypt hash to compare against
        
    Returns:
        bool: True if password matches, False otherwise
        
    Example:
        >>> verify_password("mysecret123", "$2b$12$EixZaYVK...")
        True
    """
    return pwd_context.verify(plain_password, hashed_password)
