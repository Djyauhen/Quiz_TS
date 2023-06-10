import {UrlManager} from "../utils/url-manager";
import {CustomHttp} from "../service/custom-http";
import config from "../../config/config";
import {Auth} from "../service/auth";
import {QueryParamsType} from "../types/query-params.type";
import {DefaultResponseType} from "../types/default-response.type";
import {UserInfoType} from "../types/user-info.type";
import {PassTestResponseType} from "../types/pass-test-response.type";

export class Result {
    private routeParams: QueryParamsType;

    constructor() {

        this.routeParams = UrlManager.getQueryParams();

        const testId: string = this.routeParams.id;
        const resultBtn: HTMLElement | null = document.getElementById('results-btn');
        if (resultBtn) {
            resultBtn.onclick = function () {
                location.href = '#/answers?id=' + testId;
            };
        }

        this.init();
    }

    private async init(): Promise<void> {
        const userInfo: UserInfoType | null = Auth.getUserInfo();
        if (!userInfo) {
            location.href = '#/';
            return;
        }

        if (this.routeParams.id) {

            try {
                const result: DefaultResponseType | PassTestResponseType = await CustomHttp.request(config.host + '/tests/' + this.routeParams.id + '/result?userId=' + userInfo.userId);

                if (result) {
                    if ((result as DefaultResponseType).error !== undefined) {
                        throw new Error((result as DefaultResponseType).message);
                    }
                    const resultScoreElement: HTMLElement | null = document.getElementById('result-score');
                    if (resultScoreElement) {
                        resultScoreElement.innerText = (result as PassTestResponseType).score.toString() + '/' + (result as PassTestResponseType).total;
                    }
                }
            } catch (error) {
                console.log(error)
            }
        }
    }
}

