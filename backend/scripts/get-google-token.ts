import { google } from 'googleapis'
import * as http from 'http'
import * as url from 'url'

const CLIENT_ID     = process.env.GOOGLE_OAUTH_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET!
const REDIRECT_URI  = 'http://localhost:3001/auth/google/callback'

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/calendar'],
})

console.log('\n✅ Opening browser automatically...\n')
console.log('If browser does not open, paste this URL manually:\n')
console.log(authUrl + '\n')

// Auto-open browser on Windows
import { exec } from 'child_process'
exec(`start "" "${authUrl}"`)

console.log('Waiting for Google to redirect back...\n')

const server = http.createServer(async (req, res) => {
  const params = new url.URL(req.url!, 'http://localhost:3001').searchParams
  const code = params.get('code')
  if (!code) { res.end('No code found'); return }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    res.end('<h2>Success! You can close this tab.</h2><p>Copy the refresh token from the terminal.</p>')
    console.log('\n✅ REFRESH TOKEN (copy this into your .env):\n')
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`)
    console.log()
    server.close()
  } catch (err) {
    res.end('Error getting token')
    console.error(err)
    server.close()
  }
})

server.listen(3001)
