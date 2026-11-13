import { SITE } from '../site.config';

/**
 * 赞助页配置。
 * 支付与赞助入口默认为空 —— 没有配置时不渲染任何按钮，也不显示虚构的二维码。
 */
export interface SponsorMethod {
  label: string;
  /** 赞助入口地址；为空则该项不渲染 */
  url: string;
  note?: string;
}

export const SPONSOR = {
  /** 页面总开关 */
  enabled: true,

  /** 开场白 */
  intro:
    '这个站点上的东西都是免费公开的：文章没有付费墙，项目没有激活码，工具没有「高级版」。如果它们替你省下了时间，你可以选择赞助。',

  /** 赞助方式；url 为空的不渲染 */
  methods: [] as SponsorMethod[],

  /** 赞赏码图片：放到 public/ 下并在此填路径，例如 '/sponsor-qr.png' */
  qrImage: null as string | null,

  /** 赞助者名单（昵称 + 可选链接） */
  supporters: [] as { name: string; url?: string; note?: string }[],

  /** 不花钱也能帮上的忙 */
  freeWays: [
    {
      title: '点亮一个 Star',
      text: '在 GitHub 上给用过的项目点 Star，是最直接的信号，也能让更多人找到它。',
      url: SITE.github,
    },
    {
      title: '提一个 Issue',
      text: '把遇到的崩溃、说不清的行为、看不懂的文档写下来。能稳定复现的 bug 报告，价值不亚于一笔赞助。',
      url: `${SITE.github}?tab=repositories`,
    },
    {
      title: '指出一处错误',
      text: '文章里的过期信息、错误结论、打错的字，发邮件告诉我，我会改并标注修订日期。',
      url: `mailto:${SITE.email}`,
    },
  ],

  /** 赞助用途说明 */
  usage: [
    '域名与托管之外的基础开销',
    '测试设备与系统版本的费用',
    '把更多想法做成能用的东西的时间',
  ],

  contactEmail: SITE.email,
} as const;
