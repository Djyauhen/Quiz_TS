export type TestResultType = {
    test: {
        id: number,
        name: string,
        questions: Array<TestResultQuestionType>
    }
}

export type TestResultQuestionType = {
    id: number,
    question: string,
    answers: Array<TestResultAnswerType>
}

export type TestResultAnswerType = {
    id: number,
    answer: string,
    correct?: boolean
}