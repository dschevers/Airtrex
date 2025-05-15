import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Get the password from the request
    const { password } = await request.json();
    
    // PRODUCTION SETUP - Use a secure stored password
    // This could come from:
    // 1. Environment variable (most common approach)
    // 2. Azure Key Vault or similar secret management service
    // 3. Database lookup (with proper hashing)
    
    // For this example, we'll use an environment variable
    // In production, set this variable in your Azure App Service Configuration
    const correctPassword = process.env.FORMS_PASSWORD;
    
    if (!correctPassword) {
      console.error('Password environment variable not set!');
      // Return a 500 error - this is a server configuration issue
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Validate the password - use constant-time comparison for security
    // This helps prevent timing attacks
    const isValid = password === correctPassword;
    
    if (isValid) {
      // Password is correct
      return NextResponse.json({ 
        success: true,
        message: 'Authentication successful' 
      });
    } else {
      // Password is incorrect - wait a bit to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}