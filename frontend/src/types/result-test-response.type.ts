export type ResultTestResponseType = {
    user_id: number,
    test_id: number,
    score: number,
    total: number,
    chosen_options: Array<number>
}