import bcrypt from 'bcrypt';

export async function hashPass(pass: string): Promise<string> {
    const rounds = 10;
    const hash = await bcrypt.hash(pass, rounds);
    return hash;
}

