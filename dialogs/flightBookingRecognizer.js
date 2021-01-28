// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');

class FlightBookingRecognizer {
    constructor(config) {
        const luisIsConfigured = config && config.applicationId && config.endpointKey && config.endpoint;
        if (luisIsConfigured) {
            // Set the recognizer options depending on which endpoint version you want to use e.g v2 or v3.
            // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
            const recognizerOptions = {
                apiVersion: 'v3'
            };

            this.recognizer = new LuisRecognizer(config, recognizerOptions);
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    getFromEntities(result) {
        let fromValue, fromAirportValue;
        if (result.entities.$instance.From) {
            fromValue = result.entities.$instance.From[0].text;
        }
        if (fromValue && result.entities.From[0].Airport) {
            fromAirportValue = result.entities.From[0].Airport[0][0];
        }

        return { from: fromValue, airport: fromAirportValue };
    }

    getToEntities(result) {
        let toValue, toAirportValue;
        if (result.entities.$instance.To) {
            toValue = result.entities.$instance.To[0].text;
        }
        if (toValue && result.entities.To[0].Airport) {
            toAirportValue = result.entities.To[0].Airport[0][0];
        }

        return { to: toValue, airport: toAirportValue };
    }

    /**
     * This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
     * TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
     */
    getTravelDate(result) {
        const datetimeEntity = result.entities.datetime;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}

module.exports.FlightBookingRecognizer = FlightBookingRecognizer;

// SIG // Begin signature block
// SIG // MIInNgYJKoZIhvcNAQcCoIInJzCCJyMCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // jrSyB07cRDjp5nWF/DYCO5cFp1UnjJ6F7ytKm/hagbWg
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
// SIG // BgorBgEEAYI3AgEVMC8GCSqGSIb3DQEJBDEiBCBKbNUY
// SIG // t8i5wxAjCBlJiD7C/klkpo6IHgTjE8R3X+c3jzBCBgor
// SIG // BgEEAYI3AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBm
// SIG // AHShGoAYaHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0G
// SIG // CSqGSIb3DQEBAQUABIIBAHRsMrMIEoO0Q7De3Hk+w9RS
// SIG // MJ1c8XRqL6F1ZTs9m1nOAxK+Ig28VgPFep3cAjnxHFOs
// SIG // 83oApoCeCccrRvr9bkrqigAzaVj2n67BwuBtQt4Mmx+j
// SIG // 1vZ4QS0LNejx4M2PBhDOzTy58SV47Y+VXaPmuXzr8KD0
// SIG // v+/mvHm5cVhSDNTmmdfYgysK9aHnRE/j9Qy4YZJJoTCB
// SIG // b5sh68aRZP6QnMOvsjJfvvF8eDDvqmmsaBnLnLf9bihd
// SIG // q9djKq/FxIdZeZKSnkzj9H87aOLMpGLcgcojKbKzmpIK
// SIG // 99ZslGyjo55FwNUtm3ROIhdlxJy5XRJd+02VwQk1/eFi
// SIG // jzKmoeydrGehghLxMIIS7QYKKwYBBAGCNwMDATGCEt0w
// SIG // ghLZBgkqhkiG9w0BBwKgghLKMIISxgIBAzEPMA0GCWCG
// SIG // SAFlAwQCAQUAMIIBVQYLKoZIhvcNAQkQAQSgggFEBIIB
// SIG // QDCCATwCAQEGCisGAQQBhFkKAwEwMTANBglghkgBZQME
// SIG // AgEFAAQg/PWV3g7lQi/VEtJ9I8AFLTCqsIHzkXvoG3it
// SIG // o64n/fcCBl+76/Rd9hgTMjAyMDEyMTAxODU0MjkuMzU3
// SIG // WjAEgAIB9KCB1KSB0TCBzjELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEpMCcGA1UECxMgTWljcm9zb2Z0IE9wZXJhdGlvbnMg
// SIG // UHVlcnRvIFJpY28xJjAkBgNVBAsTHVRoYWxlcyBUU1Mg
// SIG // RVNOOkY4N0EtRTM3NC1EN0I5MSUwIwYDVQQDExxNaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloIIORDCCBPUw
// SIG // ggPdoAMCAQICEzMAAAEvsacXeVaUF4cAAAAAAS8wDQYJ
// SIG // KoZIhvcNAQELBQAwfDELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEm
// SIG // MCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENB
// SIG // IDIwMTAwHhcNMTkxMjE5MDExNTA2WhcNMjEwMzE3MDEx
// SIG // NTA2WjCBzjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEpMCcGA1UE
// SIG // CxMgTWljcm9zb2Z0IE9wZXJhdGlvbnMgUHVlcnRvIFJp
// SIG // Y28xJjAkBgNVBAsTHVRoYWxlcyBUU1MgRVNOOkY4N0Et
// SIG // RTM3NC1EN0I5MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNlMIIBIjANBgkqhkiG9w0BAQEF
// SIG // AAOCAQ8AMIIBCgKCAQEAqHxWS9UjBcPyyfTNPacR3IRn
// SIG // 1Q0djsAJs5kDihsAe8PWFq7D0rVnaVFYb6bwCuz2Xfka
// SIG // gxd0+CyEzeFkpBZ+GsucX38YNmiKWFzYuEyo09ezTqsA
// SIG // nxg4MHqLQKDUIUJifI5i/LBcpjfEYk3T0OA9dZ9zMSbY
// SIG // /9reuatcysrkQVzdqHGsLnVz5S4AwpX3EnLMlUtKE/A8
// SIG // EmX4KN0wM8l/bgNlchh5zeAI3bF5qfUMUIjSBqommsx4
// SIG // vg6bUpjYBkwiAE8SShjU3sAjl7vJuQgvz4zPeKeKNvis
// SIG // NOReTzrO1TDLht1zUzIp7aPah1P5AgMDb4zxwxMgaUqf
// SIG // sTIPY01dTwIDAQABo4IBGzCCARcwHQYDVR0OBBYEFKaX
// SIG // 9VGkE0WQAwOKpyipaLzmP+qWMB8GA1UdIwQYMBaAFNVj
// SIG // OlyKMZDzQ3t8RhvFM2hahW1VMFYGA1UdHwRPME0wS6BJ
// SIG // oEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kv
// SIG // Y3JsL3Byb2R1Y3RzL01pY1RpbVN0YVBDQV8yMDEwLTA3
// SIG // LTAxLmNybDBaBggrBgEFBQcBAQROMEwwSgYIKwYBBQUH
// SIG // MAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kv
// SIG // Y2VydHMvTWljVGltU3RhUENBXzIwMTAtMDctMDEuY3J0
// SIG // MAwGA1UdEwEB/wQCMAAwEwYDVR0lBAwwCgYIKwYBBQUH
// SIG // AwgwDQYJKoZIhvcNAQELBQADggEBAHirqKW/ZKUa8kP/
// SIG // t1t+ggpkE7aLpgDByTDntOkKu3b5IDHZ1wXsm9EwI+Es
// SIG // JKCqPI1wlGzjRwRc9st3NkwkfNy/vcAXsvqZZleDZoGM
// SIG // bVJzmoziOMT+fAhf4Lr+h2bn9qxTgkiUUK5RmPOp2KvX
// SIG // weRFVC97YfBXSUJcdCz5Xeb0PLID1votIiTcY4Vm7sXX
// SIG // VbLH/l1VeKw89M/CH0ld8wP1bXvczX5lnJyY7TeVRzgb
// SIG // UWKWCnFY12Baf8M71mGhbnI3r4FR12cnhwJwKNyDywHm
// SIG // uS08/ylVkBDtpSqQB6qj4W4KQBQB0lERIKlHnCBI+1W8
// SIG // U8yM40TfoNsq1/OR+IcwggZxMIIEWaADAgECAgphCYEq
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
// SIG // Y28xJjAkBgNVBAsTHVRoYWxlcyBUU1MgRVNOOkY4N0Et
// SIG // RTM3NC1EN0I5MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQAz
// SIG // 8JkJSlyVD2p+v+vfL2iwgg9KZKCBgzCBgKR+MHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEB
// SIG // BQUAAgUA43zTATAiGA8yMDIwMTIxMDIxMDE1M1oYDzIw
// SIG // MjAxMjExMjEwMTUzWjB3MD0GCisGAQQBhFkKBAExLzAt
// SIG // MAoCBQDjfNMBAgEAMAoCAQACAiYrAgH/MAcCAQACAhKD
// SIG // MAoCBQDjfiSBAgEAMDYGCisGAQQBhFkKBAIxKDAmMAwG
// SIG // CisGAQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMB
// SIG // hqAwDQYJKoZIhvcNAQEFBQADgYEAazhXjKhaR9fmclhY
// SIG // IrL3Djqj0kUTLoZyHid8IILNZFGyAsZMEyhgQr/RX9Ar
// SIG // Wi3Vo2t2zRqRN2W/7jnVxbDbTOu1GeJ2Io824QsrCMRy
// SIG // 05zxDRiI10Zo5RNq/slLxA2RCFd0qyyZXtSO0ophTc+L
// SIG // 6XT69I4XHpi9cuhzWIvomD0xggMNMIIDCQIBATCBkzB8
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAS+x
// SIG // pxd5VpQXhwAAAAABLzANBglghkgBZQMEAgEFAKCCAUow
// SIG // GgYJKoZIhvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8GCSqG
// SIG // SIb3DQEJBDEiBCD4WpSYUVWeNf6nI9JeSzRJTl2+fVef
// SIG // 56Tq8ZW5s34IrTCB+gYLKoZIhvcNAQkQAi8xgeowgecw
// SIG // geQwgb0EIELlF5wZm+6Ce9VeDzTOWsa/W5Xfks2T4f10
// SIG // GPcKEU+9MIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // UENBIDIwMTACEzMAAAEvsacXeVaUF4cAAAAAAS8wIgQg
// SIG // 5ustek+M4pgZ9awuJrEujWgJtpV2zQ75CbSPUwlYCasw
// SIG // DQYJKoZIhvcNAQELBQAEggEAVFuZvRtkhUXVJA06d31g
// SIG // 55m5yC7+pozdOFz2aXNVOlMqchVNgIn4yZBu848fbNn7
// SIG // n0L6vSyRIKGzLrb7YSWFB1Z+q20LguaEkPpRKcB+iQrq
// SIG // XJbAHVNXe3ELDP34TJbKYlLY+KofxaoNrepYV9nrcLrh
// SIG // jyPPY6xW4YwXoihKGINQf59jn/P+LMBJYvWnxQlwCVtR
// SIG // UXUwRSksFUEYIXebJ6sfIWl8D/VudJEqRB7kT0fLyW9X
// SIG // tZy/khiR3x+7sLmjXw68dwejDiFwtgrDNPs5Ot+Wj9uW
// SIG // k4I0JjrzCNcojJnjVYwgVbaDl6gLIy/UOPRsY03sZHWA
// SIG // iWODl4xGnRIUDw==
// SIG // End signature block
