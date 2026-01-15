import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getUser, getRpID, setCurrentChallenge } from '@/lib/webauthn';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body?.username || 'demo';

    const user = getUser(username);
    if (!user || user.devices.length === 0) {
      return NextResponse.json({ error: 'No passkey registered.' }, { status: 400 });
    }

    const options = await generateAuthenticationOptions({
      rpID: getRpID(),
      allowCredentials: user.devices.map((device) => ({
        id: device.credentialID,
        type: 'public-key',
        transports: device.transports
      })),
      userVerification: 'preferred'
    });

    setCurrentChallenge(user.username, options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
