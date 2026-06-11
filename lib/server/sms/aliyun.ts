import Dysmsapi20170525, { SendSmsRequest } from "@alicloud/dysmsapi20170525";
import { Config } from "@alicloud/openapi-client";

type AliyunSmsConfig = {
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
  endpoint: string;
  regionId: string;
};

function readAliyunSmsConfig(): AliyunSmsConfig | null {
  const accessKeyId = (process.env.ALIYUN_SMS_ACCESS_KEY_ID || "").trim();
  const accessKeySecret = (process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || "").trim();
  const signName = (process.env.ALIYUN_SMS_SIGN_NAME || "").trim();
  const templateCode = (process.env.ALIYUN_SMS_TEMPLATE_CODE || "").trim();
  const endpoint = (process.env.ALIYUN_SMS_ENDPOINT || "dysmsapi.aliyuncs.com").trim();
  const regionId = (process.env.ALIYUN_SMS_REGION_ID || "cn-hangzhou").trim();

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    return null;
  }

  return {
    accessKeyId,
    accessKeySecret,
    signName,
    templateCode,
    endpoint,
    regionId,
  };
}

export function isAliyunSmsConfigured() {
  return Boolean(readAliyunSmsConfig());
}

let client: Dysmsapi20170525 | null = null;

function getClient() {
  if (client) {
    return client;
  }

  const config = readAliyunSmsConfig();

  if (!config) {
    throw new Error("阿里云短信环境变量未配置完整。");
  }

  client = new Dysmsapi20170525(
    new Config({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: config.endpoint,
      regionId: config.regionId,
    }),
  );

  return client;
}

export async function sendAliyunLoginCode(phone: string, code: string) {
  const config = readAliyunSmsConfig();

  if (!config) {
    throw new Error("阿里云短信环境变量未配置完整。");
  }

  const response = await getClient().sendSms(
    new SendSmsRequest({
      phoneNumbers: phone,
      signName: config.signName,
      templateCode: config.templateCode,
      templateParam: JSON.stringify({ code }),
      outId: `login:${phone}`,
    }),
  );

  const body = response.body;

  if (body?.code !== "OK") {
    throw new Error(body?.message || "阿里云短信发送失败。");
  }

  return {
    requestId: body.requestId ?? "",
    bizId: body.bizId ?? "",
    code: body.code ?? "OK",
  };
}
