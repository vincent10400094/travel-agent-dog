// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict'
const { CardFactory } = require('botbuilder');
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const moment = require('moment-timezone');
const ACData = require("adaptivecards-templating");

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

const WelcomeCard = require('../templates/welcomeCard.json');

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, recommendDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!recommendDialog) throw new Error('[MainDialog]: Missing parameter \'recommendDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(recommendDialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : "汪汪汪，我是大瘋狗！";
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        console.log('[mainDialog] intro');
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const recommendDetails = {};

        if (!this.luisRecognizer.isConfigured) {
            return await stepContext.beginDialog('recommendDialog', recommendDetails);
        }

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        console.log('Intent:', LuisRecognizer.topIntent(luisResult, "None", 0.3));
        switch (LuisRecognizer.topIntent(luisResult, "None", 0.3)) {
            case 'EnterRegion': {
                // Extract the values for the composite entities from the LUIS result.
                const district = this.luisRecognizer.getDistrict(luisResult);

                // Show a warning for Origin and Destination if we can't resolve them.
                const supportedDistrict = ['北投', '士林', '內湖', '松山', '中山', '大同', '南港', '信義', '大安', '中正', '萬華', '文山', '北投區', '士林區', '內湖區', '松山區', '中山區', '大同區', '南港區', '信義區', '大安區', '中正區', '萬華區', '文山區'];
                
                if (district === undefined) {
                    const messageText = '請指定台北市的行政區！';
                    await stepContext.context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
                    break;
                } else if (!supportedDistrict.includes(district)) {
                    const messageText = '很抱歉，旅遊大瘋狗的管轄範圍只有台北市！';
                    await stepContext.context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
                    break;
                }
                // await this.showWarningForUnsupportedCities(stepContext.context, district);

                recommendDetails.district = district;
                recommendDetails.spotOrFood = -1;
                console.log('LUIS extracted these booking details:', JSON.stringify(recommendDetails));

                console.log('[mainDialog] begin dialog');
                return await stepContext.beginDialog('recommendDialog', recommendDetails);
            }

            case 'FindSpot': {
                
                const district = this.luisRecognizer.getDistrict(luisResult);
                console.log(district)
                // Show a warning for Origin and Destination if we can't resolve them.
                // await this.showWarningForUnsupportedCities(stepContext.context, district);
                const supportedDistrict = ['北投', '士林', '內湖', '松山', '中山', '大同', '南港', '信義', '大安', '中正', '萬華', '文山', '北投區', '士林區', '內湖區', '松山區', '中山區', '大同區', '南港區', '信義區', '大安區', '中正區', '萬華區', '文山區'];
                
                if (district  === undefined) {
                    console.log("undefined")
                    const messageText = '請指定台北市的行政區！';
                    await stepContext.context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
                    break;
                } else if (!supportedDistrict.includes(district)) {
                    const messageText = '很抱歉，旅遊大瘋狗的管轄範圍只有台北市！';
                    await stepContext.context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
                    break;
                }

                recommendDetails.district = district;
                recommendDetails.spotOrFood = 0;
                console.log('LUIS extracted these booking details:', JSON.stringify(recommendDetails));

                console.log('[mainDialog] begin dialog');
                return await stepContext.beginDialog('recommendDialog', recommendDetails);
            }

            case 'FindFood': {
                const district = this.luisRecognizer.getDistrict(luisResult);

                // Show a warning for Origin and Destination if we can't resolve them.
                // await this.showWarningForUnsupportedCities(stepContext.context, district);
                const supportedDistrict = ['北投', '士林', '內湖', '松山', '中山', '大同', '南港', '信義', '大安', '中正', '萬華', '文山', '北投區', '士林區', '內湖區', '松山區', '中山區', '大同區', '南港區', '信義區', '大安區', '中正區', '萬華區', '文山區'];

                if (district  === undefined) {
                    const messageText = '請指定台北市的行政區！';
                    await stepContext.context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
                    break;
                } else if (!supportedDistrict.includes(district)) {
                    const messageText = '很抱歉，旅遊大瘋狗的管轄範圍只有台北市！';
                    await stepContext.context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
                    break;
                }

                recommendDetails.district = district;
                recommendDetails.spotOrFood = 1;
                console.log('LUIS extracted these booking details:', JSON.stringify(recommendDetails));

                console.log('[mainDialog] begin dialog');
                return await stepContext.beginDialog('recommendDialog', recommendDetails);
            }

            case 'Miscellaneous': {
                const message = "我是隻狗，不太擅長聊天耶⋯⋯"
                await stepContext.context.sendActivity(message, message, InputHints.IgnoringInput);
                break;
            }

            default: {
                // Catch all for unhandled intents
                const didntUnderstandMessageText = '不好意思，我沒有聽懂欸...汪汪！';
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);

                var welcomeCard = CardFactory.adaptiveCard(WelcomeCard);

                // await stepContext.context.sendActivity(MessageFactory.carousel(cardArray));
                await stepContext.context.sendActivity({ attachments: [welcomeCard] });
                break;
            }
        }

        return await stepContext.next();
    }

    /**
     * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
     * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
     * will be empty if those entity values can't be mapped to a canonical item in the Airport.
     */
    async showWarningForUnsupportedCities(context, district) {
        const supportedDistrict = ['北投', '士林', '內湖', '松山', '中山', '大同', '南港', '信義', '大安', '中正', '萬華', '文山', '北投區', '士林區', '內湖區', '松山區', '中山區', '大同區', '南港區', '信義區', '大安區', '中正區', '萬華區', '文山區'];
        const messageText = '很抱歉，旅遊大瘋狗的管轄範圍只有台北市！';
        if (!supportedDistrict.includes(district)) {
            await context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
        }
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        console.log('[mainDialog] final');
        if (stepContext.reason == 'endCalled') {
            return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: '推薦完成，還想來點別的行程嗎？' });

        } else {
            // Restart the main dialog with a different message the second time around
            return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: '想去台北的哪裡嗎？' });
        }
    }
}

module.exports.MainDialog = MainDialog;

// SIG // Begin signature block
// SIG // MIInNgYJKoZIhvcNAQcCoIInJzCCJyMCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // 1uOUN+OOPPkjBiw2AMhBDgEqzNggbEL5C/haGv/3Js2g
// SIG // ghFlMIIIdzCCB1+gAwIBAgITNgAAAQl3quySnj9vOwAB
// SIG // AAABCTANBgkqhkiG9w0BAQsFADBBMRMwEQYKCZImiZPy
// SIG // LGQBGRYDR0JMMRMwEQYKCZImiZPyLGQBGRYDQU1FMRUw
// SIG // EwYDVQQDEwxBTUUgQ1MgQ0EgMDEwHhcNMjAwMjA5MTMy
// SIG // MzMxWhcNMjEwMjA4MTMyMzMxWjAkMSIwIAYDVQQDExlN
// SIG // aWNyb3NvZnQgQXp1cmUgQ29kZSBTaWduMIIBIjANBgkq
// SIG // hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmGzl5pbMxZ7g
// SIG // jwTFFegQtSdUDiO/nKijbcxfE6VYIbZiqs912OOm/2MT
// SIG // h8U0KfSensJyyxMwtrT+QAMfk8aq9R6Tcutw9lPFmwbk
// SIG // aVwZNG2/H/MayaCuyFbUiYtHTVwkNBP1wwsOhAEZQ62T
// SIG // 30WEdusZNXgh6F+nVgUis5K0LjgJHE6JlNHYhVSltTuQ
// SIG // O+21xshfpd9XgeRsi42j3edhuhsyQSGGCgLa31kXR9C3
// SIG // ovyz6k3Jtc94CzC9ARikTb8YuDNtY2QRPS8Ar5CCiyGY
// SIG // i/zzOiD13QlYXr8U3432bgfxhKdElpi/hHUaHnsdPOLI
// SIG // jfCLXSz3YOob6al7Hv4nSwIDAQABo4IFgzCCBX8wKQYJ
// SIG // KwYBBAGCNxUKBBwwGjAMBgorBgEEAYI3WwEBMAoGCCsG
// SIG // AQUFBwMDMD0GCSsGAQQBgjcVBwQwMC4GJisGAQQBgjcV
// SIG // CIaQ4w2E1bR4hPGLPoWb3RbOnRKBYIPdzWaGlIwyAgFk
// SIG // AgEMMIICdgYIKwYBBQUHAQEEggJoMIICZDBiBggrBgEF
// SIG // BQcwAoZWaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3Br
// SIG // aWluZnJhL0NlcnRzL0JZMlBLSUNTQ0EwMS5BTUUuR0JM
// SIG // X0FNRSUyMENTJTIwQ0ElMjAwMSgxKS5jcnQwUgYIKwYB
// SIG // BQUHMAKGRmh0dHA6Ly9jcmwxLmFtZS5nYmwvYWlhL0JZ
// SIG // MlBLSUNTQ0EwMS5BTUUuR0JMX0FNRSUyMENTJTIwQ0El
// SIG // MjAwMSgxKS5jcnQwUgYIKwYBBQUHMAKGRmh0dHA6Ly9j
// SIG // cmwyLmFtZS5nYmwvYWlhL0JZMlBLSUNTQ0EwMS5BTUUu
// SIG // R0JMX0FNRSUyMENTJTIwQ0ElMjAwMSgxKS5jcnQwUgYI
// SIG // KwYBBQUHMAKGRmh0dHA6Ly9jcmwzLmFtZS5nYmwvYWlh
// SIG // L0JZMlBLSUNTQ0EwMS5BTUUuR0JMX0FNRSUyMENTJTIw
// SIG // Q0ElMjAwMSgxKS5jcnQwUgYIKwYBBQUHMAKGRmh0dHA6
// SIG // Ly9jcmw0LmFtZS5nYmwvYWlhL0JZMlBLSUNTQ0EwMS5B
// SIG // TUUuR0JMX0FNRSUyMENTJTIwQ0ElMjAwMSgxKS5jcnQw
// SIG // ga0GCCsGAQUFBzAChoGgbGRhcDovLy9DTj1BTUUlMjBD
// SIG // UyUyMENBJTIwMDEsQ049QUlBLENOPVB1YmxpYyUyMEtl
// SIG // eSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
// SIG // Z3VyYXRpb24sREM9QU1FLERDPUdCTD9jQUNlcnRpZmlj
// SIG // YXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
// SIG // bkF1dGhvcml0eTAdBgNVHQ4EFgQUhX+XKjFG3imHupcw
// SIG // W0fynaqQrlIwDgYDVR0PAQH/BAQDAgeAMFAGA1UdEQRJ
// SIG // MEekRTBDMSkwJwYDVQQLEyBNaWNyb3NvZnQgT3BlcmF0
// SIG // aW9ucyBQdWVydG8gUmljbzEWMBQGA1UEBRMNMjM2MTY3
// SIG // KzQ1Nzc4OTCCAdQGA1UdHwSCAcswggHHMIIBw6CCAb+g
// SIG // ggG7hjxodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtp
// SIG // aW5mcmEvQ1JML0FNRSUyMENTJTIwQ0ElMjAwMS5jcmyG
// SIG // Lmh0dHA6Ly9jcmwxLmFtZS5nYmwvY3JsL0FNRSUyMENT
// SIG // JTIwQ0ElMjAwMS5jcmyGLmh0dHA6Ly9jcmwyLmFtZS5n
// SIG // YmwvY3JsL0FNRSUyMENTJTIwQ0ElMjAwMS5jcmyGLmh0
// SIG // dHA6Ly9jcmwzLmFtZS5nYmwvY3JsL0FNRSUyMENTJTIw
// SIG // Q0ElMjAwMS5jcmyGLmh0dHA6Ly9jcmw0LmFtZS5nYmwv
// SIG // Y3JsL0FNRSUyMENTJTIwQ0ElMjAwMS5jcmyGgbpsZGFw
// SIG // Oi8vL0NOPUFNRSUyMENTJTIwQ0ElMjAwMSxDTj1CWTJQ
// SIG // S0lDU0NBMDEsQ049Q0RQLENOPVB1YmxpYyUyMEtleSUy
// SIG // MFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3Vy
// SIG // YXRpb24sREM9QU1FLERDPUdCTD9jZXJ0aWZpY2F0ZVJl
// SIG // dm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JM
// SIG // RGlzdHJpYnV0aW9uUG9pbnQwHwYDVR0jBBgwFoAUG2ai
// SIG // Gfyb66XahI8YmOkQpMN7kr0wHwYDVR0lBBgwFgYKKwYB
// SIG // BAGCN1sBAQYIKwYBBQUHAwMwDQYJKoZIhvcNAQELBQAD
// SIG // ggEBAEGHe+svgcjFAN/gO1rBxVSWabhMofX6gzoUN39f
// SIG // CwmrTUqgTVD9D2JRFYpliVL6690QB1gRtp694p0Wmor7
// SIG // 73kedS5DNUx9PfKlY7/uzDXMLvCJENndPjqAH0F0rJxT
// SIG // DV7CQWbE+lt87HHSumAhZsqz5GDiNDUz4aF/omb4cLZk
// SIG // fcfVCN3Q63fy4PvS/h+Qp+FCNNJZZjPPVwaYnIdr80Ef
// SIG // TftyffEyZ+WMXyF6A2IV+sx7vnCopTo7NrsIN8Ai91Xp
// SIG // H5ccjnshQu4RU0RVgHViifkDO/FghThJQd/GodVON8JO
// SIG // 7vga7klxP4F8hlIuTSH1LD5hBP0vJfVHsKCD3CMwggjm
// SIG // MIIGzqADAgECAhMfAAAAFLTFH8bygL5xAAAAAAAUMA0G
// SIG // CSqGSIb3DQEBCwUAMDwxEzARBgoJkiaJk/IsZAEZFgNH
// SIG // QkwxEzARBgoJkiaJk/IsZAEZFgNBTUUxEDAOBgNVBAMT
// SIG // B2FtZXJvb3QwHhcNMTYwOTE1MjEzMzAzWhcNMjEwOTE1
// SIG // MjE0MzAzWjBBMRMwEQYKCZImiZPyLGQBGRYDR0JMMRMw
// SIG // EQYKCZImiZPyLGQBGRYDQU1FMRUwEwYDVQQDEwxBTUUg
// SIG // Q1MgQ0EgMDEwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
// SIG // ggEKAoIBAQDVV4EC1vn60PcbgLndN80k3GZh/OGJcq0p
// SIG // DNIbG5q/rrRtNLVUR4MONKcWGyaeVvoaQ8J5iYInBaBk
// SIG // az7ehYnzJp3f/9Wg/31tcbxrPNMmZPY8UzXIrFRdQmCL
// SIG // sj3LcLiWX8BN8HBsYZFcP7Y92R2VWnEpbN40Q9XBsK3F
// SIG // aNSEevoRzL1Ho7beP7b9FJlKB/Nhy0PMNaE1/Q+8Y9+W
// SIG // bfU9KTj6jNxrffv87O7T6doMqDmL/MUeF9IlmSrl088b
// SIG // oLzAOt2LAeHobkgasx3ZBeea8R+O2k+oT4bwx5ZuzNpb
// SIG // GXESNAlALo8HCf7xC3hWqVzRqbdnd8HDyTNG6c6zwyf/
// SIG // AgMBAAGjggTaMIIE1jAQBgkrBgEEAYI3FQEEAwIBATAj
// SIG // BgkrBgEEAYI3FQIEFgQUkfwzzkKe9pPm4n1U1wgYu7jX
// SIG // cWUwHQYDVR0OBBYEFBtmohn8m+ul2oSPGJjpEKTDe5K9
// SIG // MIIBBAYDVR0lBIH8MIH5BgcrBgEFAgMFBggrBgEFBQcD
// SIG // AQYIKwYBBQUHAwIGCisGAQQBgjcUAgEGCSsGAQQBgjcV
// SIG // BgYKKwYBBAGCNwoDDAYJKwYBBAGCNxUGBggrBgEFBQcD
// SIG // CQYIKwYBBQUIAgIGCisGAQQBgjdAAQEGCysGAQQBgjcK
// SIG // AwQBBgorBgEEAYI3CgMEBgkrBgEEAYI3FQUGCisGAQQB
// SIG // gjcUAgIGCisGAQQBgjcUAgMGCCsGAQUFBwMDBgorBgEE
// SIG // AYI3WwEBBgorBgEEAYI3WwIBBgorBgEEAYI3WwMBBgor
// SIG // BgEEAYI3WwUBBgorBgEEAYI3WwQBBgorBgEEAYI3WwQC
// SIG // MBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1Ud
// SIG // DwQEAwIBhjASBgNVHRMBAf8ECDAGAQH/AgEAMB8GA1Ud
// SIG // IwQYMBaAFCleUV5krjS566ycDaeMdQHRCQsoMIIBaAYD
// SIG // VR0fBIIBXzCCAVswggFXoIIBU6CCAU+GI2h0dHA6Ly9j
// SIG // cmwxLmFtZS5nYmwvY3JsL2FtZXJvb3QuY3JshjFodHRw
// SIG // Oi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpaW5mcmEvY3Js
// SIG // L2FtZXJvb3QuY3JshiNodHRwOi8vY3JsMi5hbWUuZ2Js
// SIG // L2NybC9hbWVyb290LmNybIYjaHR0cDovL2NybDMuYW1l
// SIG // LmdibC9jcmwvYW1lcm9vdC5jcmyGgapsZGFwOi8vL0NO
// SIG // PWFtZXJvb3QsQ049QU1FUk9PVCxDTj1DRFAsQ049UHVi
// SIG // bGljJTIwS2V5JTIwU2VydmljZXMsQ049U2VydmljZXMs
// SIG // Q049Q29uZmlndXJhdGlvbixEQz1BTUUsREM9R0JMP2Nl
// SIG // cnRpZmljYXRlUmV2b2NhdGlvbkxpc3Q/YmFzZT9vYmpl
// SIG // Y3RDbGFzcz1jUkxEaXN0cmlidXRpb25Qb2ludDCCAasG
// SIG // CCsGAQUFBwEBBIIBnTCCAZkwNwYIKwYBBQUHMAKGK2h0
// SIG // dHA6Ly9jcmwxLmFtZS5nYmwvYWlhL0FNRVJPT1RfYW1l
// SIG // cm9vdC5jcnQwRwYIKwYBBQUHMAKGO2h0dHA6Ly9jcmwu
// SIG // bWljcm9zb2Z0LmNvbS9wa2lpbmZyYS9jZXJ0cy9BTUVS
// SIG // T09UX2FtZXJvb3QuY3J0MDcGCCsGAQUFBzAChitodHRw
// SIG // Oi8vY3JsMi5hbWUuZ2JsL2FpYS9BTUVST09UX2FtZXJv
// SIG // b3QuY3J0MDcGCCsGAQUFBzAChitodHRwOi8vY3JsMy5h
// SIG // bWUuZ2JsL2FpYS9BTUVST09UX2FtZXJvb3QuY3J0MIGi
// SIG // BggrBgEFBQcwAoaBlWxkYXA6Ly8vQ049YW1lcm9vdCxD
// SIG // Tj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMs
// SIG // Q049U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1B
// SIG // TUUsREM9R0JMP2NBQ2VydGlmaWNhdGU/YmFzZT9vYmpl
// SIG // Y3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5MA0G
// SIG // CSqGSIb3DQEBCwUAA4ICAQAot0qGmo8fpAFozcIA6pCL
// SIG // ygDhZB5ktbdA5c2ZabtQDTXwNARrXJOoRBu4Pk6VHVa7
// SIG // 8Xbz0OZc1N2xkzgZMoRpl6EiJVoygu8Qm27mHoJPJ9ao
// SIG // 9603I4mpHWwaqh3RfCfn8b/NxNhLGfkrc3wp2VwOtkAj
// SIG // J+rfJoQlgcacD14n9/VGt9smB6j9ECEgJy0443B+mwFd
// SIG // yCJO5OaUP+TQOqiC/MmA+r0Y6QjJf93GTsiQ/Nf+fjzi
// SIG // zTMdHggpTnxTcbWg9JCZnk4cC+AdoQBKR03kTbQfIm/n
// SIG // M3t275BjTx8j5UhyLqlqAt9cdhpNfdkn8xQz1dT6hTnL
// SIG // iowvNOPUkgbQtV+4crzKgHuHaKfJN7tufqHYbw3FnTZo
// SIG // pnTFr6f8mehco2xpU8bVKhO4i0yxdXmlC0hKGwGqdeoW
// SIG // NjdskyUyEih8xyOK47BEJb6mtn4+hi8TY/4wvuCzcvrk
// SIG // Zn0F0oXd9JbdO+ak66M9DbevNKV71YbEUnTZ81toX0Lt
// SIG // sbji4PMyhlTg/669BoHsoTg4yoC9hh8XLW2/V2lUg3+q
// SIG // HHQf/2g2I4mm5lnf1mJsu30NduyrmrDIeZ0ldqKzHAHn
// SIG // fAmyFSNzWLvrGoU9Q0ZvwRlDdoUqXbD0Hju98GL6dTew
// SIG // 3S2mcs+17DgsdargsEPm6I1lUE5iixnoEqFKWTX5j/TL
// SIG // UjGCFSkwghUlAgEBMFgwQTETMBEGCgmSJomT8ixkARkW
// SIG // A0dCTDETMBEGCgmSJomT8ixkARkWA0FNRTEVMBMGA1UE
// SIG // AxMMQU1FIENTIENBIDAxAhM2AAABCXeq7JKeP287AAEA
// SIG // AAEJMA0GCWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJ
// SIG // AzEMBgorBgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAM
// SIG // BgorBgEEAYI3AgEVMC8GCSqGSIb3DQEJBDEiBCA9bWeT
// SIG // mw1G4G6s4dDfZVl/NuwPLpM6QcXwA/h/G7so0zBCBgor
// SIG // BgEEAYI3AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBm
// SIG // AHShGoAYaHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0G
// SIG // CSqGSIb3DQEBAQUABIIBAAbgcCdopgBHaRPQPU6eOM/C
// SIG // 1JNfpXv9+Kd/m/9fApEckpipd1CR0mOAuYb69byVdMKe
// SIG // rkfYqvXN/LOuvsg0yHbZl0dBIw9OezccmnX+wflkHxRU
// SIG // bNDW59qGF9v9vxcwfG3vRCAv0M9G1b5jN8dpP9Xwnn5N
// SIG // y2qHW2TezXq5OX+8O72ZT21XSthmJKIW7pjYONQRZ1Ci
// SIG // NZsiNDnw7UT0JljL29OmVWDJz/aIdTWCSP44DadigpnA
// SIG // 4dR7d5p83UhDFYupdtvKXcqFUYXt7ywEdAkCRnLQOzsz
// SIG // DXb+9swPtIss1Xw02r/rL8nf01I7J7whJzryGixsFp77
// SIG // +SoLdvkx9QChghLxMIIS7QYKKwYBBAGCNwMDATGCEt0w
// SIG // ghLZBgkqhkiG9w0BBwKgghLKMIISxgIBAzEPMA0GCWCG
// SIG // SAFlAwQCAQUAMIIBVQYLKoZIhvcNAQkQAQSgggFEBIIB
// SIG // QDCCATwCAQEGCisGAQQBhFkKAwEwMTANBglghkgBZQME
// SIG // AgEFAAQgXuOzX2YqT10GG/lVpCM5KoKw9LwrH9gh1Foj
// SIG // 7y0gaDcCBl+76zcT8BgTMjAyMDEyMTAxODU0NDguNDk3
// SIG // WjAEgAIB9KCB1KSB0TCBzjELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEpMCcGA1UECxMgTWljcm9zb2Z0IE9wZXJhdGlvbnMg
// SIG // UHVlcnRvIFJpY28xJjAkBgNVBAsTHVRoYWxlcyBUU1Mg
// SIG // RVNOOjMyQkQtRTNENS0zQjFEMSUwIwYDVQQDExxNaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloIIORDCCBPUw
// SIG // ggPdoAMCAQICEzMAAAEuqNIZB5P0a+gAAAAAAS4wDQYJ
// SIG // KoZIhvcNAQELBQAwfDELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEm
// SIG // MCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENB
// SIG // IDIwMTAwHhcNMTkxMjE5MDExNTA1WhcNMjEwMzE3MDEx
// SIG // NTA1WjCBzjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEpMCcGA1UE
// SIG // CxMgTWljcm9zb2Z0IE9wZXJhdGlvbnMgUHVlcnRvIFJp
// SIG // Y28xJjAkBgNVBAsTHVRoYWxlcyBUU1MgRVNOOjMyQkQt
// SIG // RTNENS0zQjFEMSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNlMIIBIjANBgkqhkiG9w0BAQEF
// SIG // AAOCAQ8AMIIBCgKCAQEArtNMolFTX3osUiMxD2r9SOk+
// SIG // HPjeblGceAcBWnZgaeLvj6W2xig7WdnnytNsmEJDwZgf
// SIG // LwHh16+Buqpg9A1TeL52ukS0Rw0tuwyvgwSrdIz687dr
// SIG // pAwV3WUNHLshAs8k0sq9wzr023uS7VjIzk2c80NxEmyd
// SIG // Rv/xjH/NxblxaOeiPyz19D3cE9/8nviozWqXYJ3NBXvg
// SIG // 8GKww/+2mkCdK43Cjwjv65avq9+kHKdJYO8l4wOtyxrr
// SIG // ZeybsNsHU2dKw8YAa3dHOUFX0pWJyLN7hTd+jhyF2gHb
// SIG // 5Au7Xs9oSaPTuqrvTQIblcmSkRg6N500WIHICkXthG9C
// SIG // s5lDTtBiIwIDAQABo4IBGzCCARcwHQYDVR0OBBYEFIaa
// SIG // iSZOC4k3u6pJNDVSEvC3VE5sMB8GA1UdIwQYMBaAFNVj
// SIG // OlyKMZDzQ3t8RhvFM2hahW1VMFYGA1UdHwRPME0wS6BJ
// SIG // oEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kv
// SIG // Y3JsL3Byb2R1Y3RzL01pY1RpbVN0YVBDQV8yMDEwLTA3
// SIG // LTAxLmNybDBaBggrBgEFBQcBAQROMEwwSgYIKwYBBQUH
// SIG // MAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kv
// SIG // Y2VydHMvTWljVGltU3RhUENBXzIwMTAtMDctMDEuY3J0
// SIG // MAwGA1UdEwEB/wQCMAAwEwYDVR0lBAwwCgYIKwYBBQUH
// SIG // AwgwDQYJKoZIhvcNAQELBQADggEBAI3gBGqnMK6602pj
// SIG // adYkMNePfmJqJ2WC0n9uyliwBfxq0mXX0h9QojNO65JV
// SIG // Tdxpdnr9i8wxgxxuw1r/gnby6zbcro9ZkCWMiPQbxC3A
// SIG // MyVAeOsqetyvgUEDPpmq8HpKs3f9ZtvRBIr86XGxTSZ8
// SIG // PvPztHYkziDAom8foQgu4AS2PBQZIHU0qbdPCubnV8IP
// SIG // SPG9bHNpRLZ628w+uHwM2uscskFHdQe+D81dLYjN1Cfb
// SIG // TGOOxbQFQCJN/40JGnFS+7+PzQ1vX76+d6OJt+lAnYiV
// SIG // eIl0iL4dv44vdc6vwxoMNJg5pEUAh9yirdU+LgGS9ILx
// SIG // Aau+GMBlp+QTtHovkUkwggZxMIIEWaADAgECAgphCYEq
// SIG // AAAAAAACMA0GCSqGSIb3DQEBCwUAMIGIMQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQgUm9v
// SIG // dCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAeFw0x
// SIG // MDA3MDEyMTM2NTVaFw0yNTA3MDEyMTQ2NTVaMHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwMIIBIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqR0NvHcRijog7PwT
// SIG // l/X6f2mUa3RUENWlCgCChfvtfGhLLF/Fw+Vhwna3PmYr
// SIG // W/AVUycEMR9BGxqVHc4JE458YTBZsTBED/FgiIRUQwzX
// SIG // Tbg4CLNC3ZOs1nMwVyaCo0UN0Or1R4HNvyRgMlhgRvJY
// SIG // R4YyhB50YWeRX4FUsc+TTJLBxKZd0WETbijGGvmGgLvf
// SIG // YfxGwScdJGcSchohiq9LZIlQYrFd/XcfPfBXday9ikJN
// SIG // QFHRD5wGPmd/9WbAA5ZEfu/QS/1u5ZrKsajyeioKMfDa
// SIG // TgaRtogINeh4HLDpmc085y9Euqf03GS9pAHBIAmTeM38
// SIG // vMDJRF1eFpwBBU8iTQIDAQABo4IB5jCCAeIwEAYJKwYB
// SIG // BAGCNxUBBAMCAQAwHQYDVR0OBBYEFNVjOlyKMZDzQ3t8
// SIG // RhvFM2hahW1VMBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIA
// SIG // QwBBMAsGA1UdDwQEAwIBhjAPBgNVHRMBAf8EBTADAQH/
// SIG // MB8GA1UdIwQYMBaAFNX2VsuP6KJcYmjRPZSQW9fOmhjE
// SIG // MFYGA1UdHwRPME0wS6BJoEeGRWh0dHA6Ly9jcmwubWlj
// SIG // cm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3RzL01pY1Jv
// SIG // b0NlckF1dF8yMDEwLTA2LTIzLmNybDBaBggrBgEFBQcB
// SIG // AQROMEwwSgYIKwYBBQUHMAKGPmh0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0
// SIG // XzIwMTAtMDYtMjMuY3J0MIGgBgNVHSABAf8EgZUwgZIw
// SIG // gY8GCSsGAQQBgjcuAzCBgTA9BggrBgEFBQcCARYxaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tL1BLSS9kb2NzL0NQ
// SIG // Uy9kZWZhdWx0Lmh0bTBABggrBgEFBQcCAjA0HjIgHQBM
// SIG // AGUAZwBhAGwAXwBQAG8AbABpAGMAeQBfAFMAdABhAHQA
// SIG // ZQBtAGUAbgB0AC4gHTANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // B+aIUQ3ixuCYP4FxAz2do6Ehb7Prpsz1Mb7PBeKp/vpX
// SIG // bRkws8LFZslq3/Xn8Hi9x6ieJeP5vO1rVFcIK1GCRBL7
// SIG // uVOMzPRgEop2zEBAQZvcXBf/XPleFzWYJFZLdO9CEMiv
// SIG // v3/Gf/I3fVo/HPKZeUqRUgCvOA8X9S95gWXZqbVr5MfO
// SIG // 9sp6AG9LMEQkIjzP7QOllo9ZKby2/QThcJ8ySif9Va8v
// SIG // /rbljjO7Yl+a21dA6fHOmWaQjP9qYn/dxUoLkSbiOewZ
// SIG // SnFjnXshbcOco6I8+n99lmqQeKZt0uGc+R38ONiU9Mal
// SIG // CpaGpL2eGq4EQoO4tYCbIjggtSXlZOz39L9+Y1klD3ou
// SIG // OVd2onGqBooPiRa6YacRy5rYDkeagMXQzafQ732D8OE7
// SIG // cQnfXXSYIghh2rBQHm+98eEA3+cxB6STOvdlR3jo+KhI
// SIG // q/fecn5ha293qYHLpwmsObvsxsvYgrRyzR30uIUBHoD7
// SIG // G4kqVDmyW9rIDVWZeodzOwjmmC3qjeAzLhIp9cAvVCch
// SIG // 98isTtoouLGp25ayp0Kiyc8ZQU3ghvkqmqMRZjDTu3Qy
// SIG // S99je/WZii8bxyGvWbWu3EQ8l1Bx16HSxVXjad5XwdHe
// SIG // MMD9zOZN+w2/XU/pnR4ZOC+8z1gFLu8NoFA12u8JJxzV
// SIG // s341Hgi62jbb01+P3nSISRKhggLSMIICOwIBATCB/KGB
// SIG // 1KSB0TCBzjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEpMCcGA1UE
// SIG // CxMgTWljcm9zb2Z0IE9wZXJhdGlvbnMgUHVlcnRvIFJp
// SIG // Y28xJjAkBgNVBAsTHVRoYWxlcyBUU1MgRVNOOjMyQkQt
// SIG // RTNENS0zQjFEMSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQD7
// SIG // X8I3oEgt5TXIMaj5vpaSkuhCm6CBgzCBgKR+MHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEB
// SIG // BQUAAgUA43zSMDAiGA8yMDIwMTIxMDIwNTgyNFoYDzIw
// SIG // MjAxMjExMjA1ODI0WjB3MD0GCisGAQQBhFkKBAExLzAt
// SIG // MAoCBQDjfNIwAgEAMAoCAQACAiNQAgH/MAcCAQACAhL9
// SIG // MAoCBQDjfiOwAgEAMDYGCisGAQQBhFkKBAIxKDAmMAwG
// SIG // CisGAQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMB
// SIG // hqAwDQYJKoZIhvcNAQEFBQADgYEAFURA/7Yp4BVwc1i8
// SIG // bnGb9FD+9z/uM/btspeUhktb3nqtMg2FvbsLgyp2wh6t
// SIG // 2gVWGwhYoWpXNccxH5sPw2hjMxVc2cpQFkNMD11Hi7SU
// SIG // oCA+AGk7u4r7k8X3g5JOvobCI3ElTjblC6NFJ9ZfAVp/
// SIG // wa4Q5J48EM9jDD47vsYHg6wxggMNMIIDCQIBATCBkzB8
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAS6o
// SIG // 0hkHk/Rr6AAAAAABLjANBglghkgBZQMEAgEFAKCCAUow
// SIG // GgYJKoZIhvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8GCSqG
// SIG // SIb3DQEJBDEiBCDyxxFSakEQoqyXZ4XGaLNHJZRso4v+
// SIG // MbY3JQj6uwAsUjCB+gYLKoZIhvcNAQkQAi8xgeowgecw
// SIG // geQwgb0EINr+zc7xiFaKqlU3SRN4r7HabRECHXsmlHoO
// SIG // IWhMgskpMIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // UENBIDIwMTACEzMAAAEuqNIZB5P0a+gAAAAAAS4wIgQg
// SIG // dunfEgATyc9iRjSAD8gKnjCNw9Jnb9gmLnOcodQyCWIw
// SIG // DQYJKoZIhvcNAQELBQAEggEAlWrrNAPJ2ifa8vLeiWst
// SIG // 3HPPgYJw69lSM5WXe5qZzECJcjl9/OAi8ojl7pav7FF1
// SIG // 1CKmxIeVrHeBOCeZ/3naZK70xfn3RC3kadGYoGHYcETd
// SIG // X5zdGPtdaFJOyjdQlsk3okMfKMT/Zumv66kYm7qJ6PY8
// SIG // KORddi350MmKXvbhhUKURViwZYAYVcBtlYUmCnHSL9qf
// SIG // A0kToC2T+A+5TiOEEWPOYYilxi1kGkMec0ncatSDCh/g
// SIG // mlqwHKD4tiwL5X9UCHLMzWLvHSZWtmPfuLd2hST+axIK
// SIG // U7PBHO6gdS+tFXxqh1cGge/Xv3/gJXvwDFgqEkFaBz4R
// SIG // GBNYJNS0h9ywgg==
// SIG // End signature block

