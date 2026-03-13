"""
This package contains modules related to application authentication.

* auth.py: manages user validation via a JWT token.
  It verifies the token sent in the request, decodes the information
  it contains, and retrieves the corresponding user from the database
  in order to identify the currently logged-in user.
"""
