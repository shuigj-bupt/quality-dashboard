import * as jwt from 'jsonwebtoken';
import * as uuidv1 from 'uuid/v1';

const AUTH_KEY = uuidv1();

export class Auth {
  //
  public static async generateJWT(user: any): Promise<string> {
    return jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        user_id: user.id
      },
      AUTH_KEY
    );
  }

  public static async checkToken(token: string): Promise<any> {
    try {
      const info = jwt.verify(token, AUTH_KEY);
      return { authenticated: true, info };
    } catch (err) {
      return {
        authenticated: false
      };
    }
  }
}
