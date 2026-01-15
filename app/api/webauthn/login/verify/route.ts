import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import {
  findDeviceByID,
  getOrigin,
  getRpID,
  getUser,
  setCurrentChallenge
} from '@/lib/webauthn';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body?.username || 'demo';
    const response = body?.response;

    const user = getUser(username);
    if (!user || !user.currentChallenge) {
      return NextResponse.json({ error: 'No login in progress.' }, { status: 400 });
    }

    const device = findDeviceByID(user, response.id);
    if (!device) {
      return NextResponse.json({ error: 'Device not found.' }, { status: 400 });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpID(),
      authenticator: device
    });

    const { verified, authenticationInfo } = verification;
    if (verified) {
      device.counter = authenticationInfo.newCounter;
    }

    setCurrentChallenge(user.username, undefined);

    return NextResponse.json({ verified });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
