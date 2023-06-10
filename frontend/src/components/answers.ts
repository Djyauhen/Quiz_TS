import {UrlManager} from "../utils/url-manager";
import {Auth} from "../service/auth";
import {CustomHttp} from "../service/custom-http";
import config from "../../config/config";
import {QueryParamsType} from "../types/query-params.type";
import {UserInfoType} from "../types/user-info.type";
import {DefaultResponseType} from "../types/default-response.type";
import {PassTestResponseType} from "../types/pass-test-response.type";
import {TestResultAnswerType, TestResultType} from "../types/test-answers.type";

export class Answers {
    private optionsElement: HTMLElement | null;
    private questionTitleElement: HTMLElement | null;
    private currentQuestionIndex: number;
    private routeParams: QueryParamsType;

    constructor() {
        this.optionsElement = null;
        this.questionTitleElement = null;
        this.currentQuestionIndex = 1;

        this.routeParams = UrlManager.getQueryParams();

        this.init();
        this.showQuiz();
    }

    private async init(): Promise<void> {
        const userInfo: UserInfoType | null = Auth.getUserInfo();
        if (!userInfo) {
            location.href = '#/';
            return;
        }

        if (this.routeParams.id) {
            try {
                const result: DefaultResponseType | PassTestResponseType = await CustomHttp.request(config.host + '/tests/' + this.routeParams.id + '/result/details?userId=' + userInfo.userId);
                if (result) {
                    if ((result as DefaultResponseType).error !== undefined) {
                        throw new Error((result as DefaultResponseType).message);
                    }
                }
            } catch (error) {
                console.log(error)
            }
        }
    }

    private async showQuiz(): Promise<void> {
        const userInfo: UserInfoType | null = Auth.getUserInfo();
        if (!userInfo) {
            location.href = '#/';
            return;
        }
        console.log(userInfo);

        const result: TestResultType | null = await CustomHttp.request(config.host + '/tests/' + this.routeParams.id + '/result/details?userId=' + userInfo.userId);
        if (result) {
            const preTitle: HTMLElement | null = document.getElementById('pre-title');
            if (preTitle) {
                preTitle.innerText = result.test.name;
            }
            const fullUserName: HTMLElement | null = document.getElementById('answerFullUserName');
            if (fullUserName) {
                fullUserName.innerText = userInfo.fullName;
            }

            const userEmail: HTMLElement | null = document.getElementById('answerUserEmail');
            if (userEmail) {
                userEmail.innerText = userInfo.email;
            }

            this.optionsElement = document.getElementById('answers');

            result.test.questions.forEach(question => {
                const optionElement: HTMLElement = document.createElement('div');
                optionElement.className = 'answers-question-options';

                this.questionTitleElement = document.createElement('h2');
                this.questionTitleElement.className = 'answers-question-title';


                this.questionTitleElement.innerHTML = '<span>Вопрос ' + this.currentQuestionIndex + ':</span> ' + question.question;
                this.currentQuestionIndex++;
                optionElement.appendChild(this.questionTitleElement);

                question.answers.forEach((answer: TestResultAnswerType) => {
                    const answerItem: HTMLElement = document.createElement('div');
                    answerItem.className = 'answer-question-option';

                    const inputId: string = answer.id.toString();

                    const inputElement: HTMLInputElement = document.createElement('input');
                    inputElement.className = 'option-answer';
                    inputElement.setAttribute('id', inputId);
                    inputElement.setAttribute('type', 'radio');
                    inputElement.setAttribute('name', 'answer');
                    inputElement.setAttribute('value', inputId);

                    const labelElement: HTMLElement = document.createElement('label');
                    labelElement.setAttribute('for', inputId);
                    labelElement.innerText = answer.answer;


                    if (answer.correct === true) {
                        answerItem.className = 'correct';
                    }
                    if (answer.correct === false) {
                        answerItem.className = 'wrong';
                    }

                    answerItem.appendChild(inputElement);
                    answerItem.appendChild(labelElement);
                    optionElement.appendChild(answerItem);
                })
                if (this.optionsElement) {
                    this.optionsElement.appendChild(optionElement);
                }
            })
        }
    }
}