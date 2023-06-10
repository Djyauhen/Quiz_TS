import {UrlManager} from "../utils/url-manager";
import {CustomHttp} from "../service/custom-http";
import config from "../../config/config";
import {Auth} from "../service/auth";
import {QueryParamsType} from "../types/query-params.type";
import {QuizAnswerType, QuizQuestionType, QuizType} from "../types/quiz.type";
import {UserResultType} from "../types/user-result.type";
import {DefaultResponseType} from "../types/default-response.type";
import {ActionTestType} from "../types/action-test.type";
import {UserInfoType} from "../types/user-info.type";
import {PassTestResponseType} from "../types/pass-test-response.type";

export class Test {

    private progressBarElement: HTMLElement | null;
    private passButtonElement: HTMLElement | null;
    private nextButtonElement: HTMLElement | null;
    private prevButtonElement: HTMLElement | null;
    private questionTitleElement: HTMLElement | null;
    private optionsElement: HTMLElement | null;
    private quiz: QuizType | null;
    private currentQuestionIndex: number;
    readonly userResult: UserResultType[];
    private answersId: Array<number>;
    private routeParams: QueryParamsType;
    private interval: number = 0;


    constructor() {
        this.optionsElement = null;
        this.progressBarElement = null;
        this.nextButtonElement = null;
        this.passButtonElement = null;
        this.prevButtonElement = null;
        this.questionTitleElement = null;
        this.quiz = null;
        this.currentQuestionIndex = 1;
        this.userResult = [];
        this.answersId = [];
        this.routeParams = UrlManager.getQueryParams();

        this.init();
    }

    private async init(): Promise<void> {
        if (this.routeParams.id) {
            try {
                const result: DefaultResponseType | QuizType = await CustomHttp.request(config.host + '/tests/' + this.routeParams.id)
                if (result) {
                    if ((result as DefaultResponseType).error !== undefined) {
                        throw new Error((result as DefaultResponseType).message);
                    }
                    this.quiz = result as QuizType;
                    this.startQuiz();
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

    private startQuiz(): void {
        if (!this.quiz) return;
        const that: Test = this;
        const preTitleElement: HTMLElement | null = document.getElementById('pre-title');
        if (preTitleElement) {
            preTitleElement.innerText = this.quiz.name;
        }

        this.progressBarElement = document.getElementById('progress-bar');
        this.questionTitleElement = document.getElementById('title');
        this.optionsElement = document.getElementById('options');
        this.nextButtonElement = document.getElementById('next');
        if (this.nextButtonElement) {
            this.nextButtonElement.onclick = this.move.bind(that, ActionTestType.next);
        }
        this.passButtonElement = document.getElementById('pass');
        if (this.passButtonElement) {
            this.passButtonElement.onclick = this.move.bind(that, ActionTestType.pass);
        }
        this.prevButtonElement = document.getElementById('prev');
        if (this.prevButtonElement) {
            this.prevButtonElement.onclick = this.move.bind(that, ActionTestType.prev);
        }

        this.prepareProgressBar();
        this.showQuestion();

        const timerElement: HTMLElement | null = document.getElementById('timer');
        let seconds = 59;
        this.interval = window.setInterval(function () {
            seconds--;
            if (timerElement) {
                timerElement.innerText = seconds.toString();
            }
            if (seconds === 0) {
                clearInterval(that.interval);
                that.complete();
            }
        }.bind(this), 1000);
    }

    private prepareProgressBar(): void {
        if (!this.quiz) return;
        for (let i = 0; i < this.quiz.questions.length; i++) {
            const itemElement: HTMLElement | null = document.createElement('div');
            itemElement.className = 'test-progress-bar-item ' + (i === 0 ? 'active' : '');

            const itemCircleElement: HTMLElement | null = document.createElement('div');
            itemCircleElement.className = 'test-progress-bar-item-circle';

            const itemTextElement: HTMLElement | null = document.createElement('div');
            itemTextElement.className = 'test-progress-bar-item-text';
            itemTextElement.innerText = 'Вопрос ' + (i + 1);

            itemElement.appendChild(itemCircleElement);
            itemElement.appendChild(itemTextElement);
            if (this.progressBarElement) {
                this.progressBarElement.appendChild(itemElement);
            }
        }
    }

    private showQuestion(): void {
        if (!this.quiz) return;
        const activeQuestion: QuizQuestionType = this.quiz.questions[this.currentQuestionIndex - 1];

        if (this.questionTitleElement) {
            this.questionTitleElement.innerHTML = '<span>Вопрос ' + this.currentQuestionIndex + ':</span> ' + activeQuestion.question;
        }
        if (this.optionsElement) {
            this.optionsElement.innerHTML = '';
        }

        const that: Test = this;
        const chosenOption: UserResultType | undefined = this.userResult.find(item => item.questionId === activeQuestion.id);

        activeQuestion.answers.forEach((answer: QuizAnswerType) => {
            const optionElement: HTMLElement | null = document.createElement('div');
            optionElement.className = 'test-question-option';

            const inputId = 'answer-' + answer.id;

            const inputElement: HTMLElement | null = document.createElement('input');
            inputElement.className = 'option-answer';
            inputElement.setAttribute('id', inputId);
            inputElement.setAttribute('type', 'radio');
            inputElement.setAttribute('name', 'answer');
            inputElement.setAttribute('value', answer.id.toString());

            if (chosenOption && chosenOption.chosenAnswerId === answer.id) {
                inputElement.setAttribute('checked', 'checked');
            }

            inputElement.onchange = function () {
                that.chooseAnswer();
            }

            const labelElement: HTMLElement | null = document.createElement('label');
            labelElement.setAttribute('for', inputId);
            labelElement.innerText = answer.answer;

            optionElement.appendChild(inputElement);
            optionElement.appendChild(labelElement);

            if (this.optionsElement) {
                this.optionsElement.appendChild(optionElement);
            }
        });

        if (this.nextButtonElement) {
            if (chosenOption && chosenOption.chosenAnswerId) {
                this.nextButtonElement.removeAttribute('disabled');
            } else {
                this.nextButtonElement.setAttribute('disabled', 'disabled');
            }

            if (this.currentQuestionIndex === this.quiz.questions.length) {
                this.nextButtonElement.innerText = 'Завершить';
            } else {
                this.nextButtonElement.innerText = 'Далее';
            }
        }

        if (this.prevButtonElement) {
            if (this.currentQuestionIndex > 1) {
                this.prevButtonElement.removeAttribute('disabled');
            } else {
                this.prevButtonElement.setAttribute('disabled', 'disabled');
            }
        }

    }

    private chooseAnswer(): void {
        if (this.nextButtonElement) {
            this.nextButtonElement.removeAttribute('disabled');
        }
    }

    private move(action: ActionTestType): void {
        if (!this.quiz) return;
        const activeQuestion: QuizQuestionType = this.quiz.questions[this.currentQuestionIndex - 1];
        const chosenAnswer: HTMLInputElement | undefined = Array.from(document.getElementsByClassName('option-answer')).find(element => {
            return (element as HTMLInputElement).checked;
        }) as HTMLInputElement;

        let chosenAnswerId: number | null = null;
        if (chosenAnswer && chosenAnswer.value) {
            chosenAnswerId = Number(chosenAnswer.value);
        }

        const existingResult: UserResultType | undefined = this.userResult.find(item => {
            return item.questionId === activeQuestion.id;
        })

        if (chosenAnswerId) {
            if (existingResult) {
                existingResult.chosenAnswerId = chosenAnswerId;
            } else {
                this.userResult.push({
                    questionId: activeQuestion.id,
                    chosenAnswerId: chosenAnswerId,
                })
                this.answersId.push(chosenAnswerId);
            }
        }

        if (action === ActionTestType.next || action === ActionTestType.pass) {
            this.currentQuestionIndex++;
        } else {
            this.currentQuestionIndex--;
        }

        if (this.currentQuestionIndex > this.quiz.questions.length) {
            clearInterval(this.interval);
            this.complete();
            return;
        }
        if (this.progressBarElement) {
            Array.from(this.progressBarElement.children).forEach((item: Element, index: number) => {
                const currentItemIndex: number = index + 1;

                item.classList.remove('complete');
                item.classList.remove('active');

                if (currentItemIndex === this.currentQuestionIndex) {
                    item.classList.add('active');
                } else if (currentItemIndex < this.currentQuestionIndex) {
                    item.classList.add('complete');
                }
            })
        }

        this.showQuestion();
    }

   private async complete(): Promise<void> {
        const userInfo: UserInfoType | null = Auth.getUserInfo();
        if (!userInfo) {
            location.href = '#/';
            return;
        }

        try {
            const result: DefaultResponseType | PassTestResponseType = await CustomHttp.request(config.host + '/tests/' + this.routeParams.id + '/pass', 'POST', {
                userId: userInfo.userId,
                results: this.userResult,
            });

            if (result) {
                if ((result as DefaultResponseType).error !== undefined) {
                    throw new Error((result as DefaultResponseType).message);
                }
                location.href = '#/result?id=' + this.routeParams.id;
            }
        } catch (error) {
            console.log(error)
        }
    }
}