/**
 * 友链。
 * 只收录本人确认过的站点；没有配置时不显示任何示例站，避免出现虚构条目。
 */
export interface Friend {
  name: string;
  url: string;
  /** 一句话介绍 */
  description: string;
  /** 头像或站点图标，可留空 */
  avatar?: string;
  /** 可选：标签 */
  tags?: string[];
}

export const FRIENDS: Friend[] = [];

/** 申请友链时需要提供的信息，显示在友链页末尾 */
export const FRIEND_REQUIREMENTS = [
  '站点名称',
  '站点地址（https）',
  '一句话介绍',
  '一个图标或头像地址（可选）',
];
