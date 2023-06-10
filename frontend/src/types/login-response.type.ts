export type LoginResponseType = {
    error: boolean,
    message: string,
    accessToken?: string,
    refreshToken?: string,
    fullName?: string,
    userId?: number
}