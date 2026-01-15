import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getOrCreateUser, getRpID, setCurrentChallenge } from '@/lib/webauthn';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body?.username || 'demo';
    const user = await getOrCreateUser(username);
    const host = request.headers.get('host') || undefined;

    const options = await generateRegistrationOptions({
      rpName: 'Passkey Demo',
      rpID: getRpID(host),
      userID: user.id,
      userName: user.username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      },
      excludeCredentials: user.devices.map((device) => ({
        id: new Uint8Array(device.credentialID),
        type: 'public-key',
        transports: device.transports
      }))
    });

    await setCurrentChallenge(user.username, options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
