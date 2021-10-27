#!/usr/bin/python
# -*- coding: utf-8 -*-
import subprocess
import sys
import math
import base64
import time
import datetime

import os
import json
import logging
import logging.config

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


class Logger:
    init_log = False

    def __init__(self, logger_name=__name__):
        if not Logger.init_log:
            Logger.setup_logging()
            Logger.init_log = True
        self.logger = logging.getLogger(logger_name)

    @staticmethod
    def setup_logging(default_path="resource/Logger.json", default_level=logging.INFO, env_key="LOG_CFG"):
        path = RelatePath + default_path
        value = os.getenv(env_key, None)
        if value:
            path = value
        if os.path.exists(path):
            if not os.path.exists('logs/'):
                os.makedirs('logs/')
            with open(path, "r") as f:
                config = json.load(f)
                logging.config.dictConfig(config)
        else:
            logging.basicConfig(level=default_level)

    def get_log(self):
        return self.logger

    def debug(self, msg, *args):
        return self.logger.debug(msg, *args)

    def info(self, msg, *args):
        return self.logger.info(msg, *args)

    def warn(self, msg, *args):
        return self.logger.warning(msg, *args)

    def error(self, msg, *args):
        return self.logger.error(msg, *args)

    def exception(self, msg, *args):
        return self.logger.exception(msg, *args)


TM_TYPE_INFO = 0
TM_TYPE_WARN = 1
TM_TYPE_ERROR = 2


# 渲染信息类
class TmRender:
    tm_current_frame = 0  # 当前帧序号
    tm_current_circle = 0  # 当前轮次
    tm_rect_last = ([0, 0, 0, 0]),  # 上次的渲染区域

    def __int__(self):
        self.tm_main_mask = tm_mask_info.copy(),  # 主模板
        self.tm_bg = (0, 0, 255)  # 背景颜色
        self.tm_use_animation = False,  # 是否使用动画

    def __init__(self, mask_type, tips, use_animation):
        if mask_type == TM_TYPE_INFO:
            self.tm_main_mask = tm_mask_info.copy()
            self.tm_bg = (0, 255, 0)
        elif mask_type == TM_TYPE_WARN:
            self.tm_main_mask = tm_mask_warn.copy()
            self.tm_bg = (0, 255, 255)
        else:
            self.tm_main_mask = tm_mask_error.copy()
            self.tm_bg = (0, 0, 255)
        pil_im = Image.fromarray(cv2.cvtColor(self.tm_main_mask, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_im)
        draw.text((20, 15), tips, 'white', font=tm_font_tips)
        self.tm_main_mask = cv2.cvtColor(np.asarray(pil_im), cv2.COLOR_RGB2BGR)
        self.tm_use_animation = use_animation,  # 是否使用动画

    # 获取混合比例
    def get_blend_beta(self):
        up1 = 10
        keep1 = 10
        down1 = 10
        up2 = 10
        down_bg = 20
        total_frame = 120
        to_keep1 = up1 + keep1
        to_down1 = to_keep1 + down1
        to_up2 = to_down1 + up2
        to_down_bg = to_up2 + down_bg
        if self.tm_current_frame < up1:
            beta_tips = self.tm_current_frame / up1
            beta_bg = beta_tips * 0.2
        elif self.tm_current_frame < to_keep1:
            beta_tips = 1.0
            beta_bg = 0.2
        elif self.tm_current_frame < to_down1:
            beta_tips = (to_down1 - self.tm_current_frame) / down1
            beta_bg = beta_tips * 0.2
        elif self.tm_current_frame < to_up2:
            beta_tips = (up2 - (to_up2 - self.tm_current_frame)) / up2
            beta_bg = beta_tips * 0.2
        elif self.tm_current_frame < to_down_bg:
            beta_tips = 1.0
            beta_bg = 0.2 * (to_down_bg - self.tm_current_frame) / down_bg
        elif self.tm_current_frame < total_frame:
            beta_tips = 1.0
            beta_bg = 0.0
        else:
            beta_tips = 0.0
            beta_bg = 0.0
        return beta_tips, beta_bg

    # 渲染帧
    def render(self, mat, rect, beta=1.0):
        if mat is None or rect is None or rect[2] == 0 or rect[3] == 0:
            return 'Arg Empty'
        if tfm_keep_size:
            if abs(rect[0] - self.tm_rect_last[0][0]) < tfm_keep_threshold and abs(
                    rect[1] - self.tm_rect_last[0][1]) < tfm_keep_threshold and abs(
                    rect[2] - self.tm_rect_last[0][2]) < tfm_keep_threshold and abs(
                    rect[3] - self.tm_rect_last[0][3]) < tfm_keep_threshold:
                rect[:] = self.tm_rect_last[0][:]
            self.tm_rect_last[0][:] = rect[:]

        # noinspection PyTypeChecker
        x, y, w, h = int(rect[0]), int(rect[1]), int(rect[2]), int(rect[3])
        if x > 0 and y > 0 and mat.shape[1] > w and mat.shape[0] > h:
            beta_tips, beta_bg = beta, 0.0
            if self.tm_use_animation[0]:
                beta_tips, beta_bg = self.get_blend_beta()
            if beta_tips > 0:
                roi_draw = mat[y:y + h, x:x + w]
                if roi_draw.shape[1] != tm_mask_width or roi_draw.shape[0] != tm_mask_height:
                    img_draw = cv2.resize(self.tm_main_mask, (roi_draw.shape[1], roi_draw.shape[0]))
                else:
                    img_draw = self.tm_main_mask.copy()
                img_draw = cv2.addWeighted(roi_draw, 1, img_draw, beta_tips, 0)
                mat[y:y + h, x:x + w] = img_draw
            if beta_bg > 0:
                mat_bg = np.zeros_like(mat)
                cv2.floodFill(mat_bg, None, (0, 0), self.tm_bg)
                cv2.addWeighted(mat, 1, mat_bg, beta_bg, 0, mat)

        self.tm_current_frame += 1
        return ''


DOOR_UNKNOWN = 0   # 门状态未知
DOOR_OPEN = 1   # 门状态开
DOOR_MIDDLE = 2   # 门状态半开
DOOR_CLOSED = 3   # 门状态关


# 门状态信息类
class DoorDetInfo:
    def __init__(self):
        self.uid = '',  # 门唯一ID
        self.left = 100,  # 位置横坐标
        self.top = 100,  # 位置纵坐标
        self.width = 500,  # 宽度
        self.height = 300,  # 高度
        self.camera_angle = 0.0,  # 拍摄角度偏移
        self.template_path = ''  # 模板路径
        self.template = cv2.imread(RelatePath + def_template_path)  # 模板

    @classmethod
    def init(cls, dict_info):
        det_info = DoorDetInfo()
        det_info.uid = dict_info['uid'],  # 门唯一ID
        det_info.left = int(dict_info['left']),  # 位置横坐标
        det_info.top = int(dict_info['top']),  # 位置纵坐标
        det_info.width = int(dict_info['width']),  # 宽度
        det_info.height = int(dict_info['height']),  # 高度
        det_info.camera_angle = float(dict_info['camera_angle']),  # 拍摄角度偏移
        det_info.template_path = dict_info['template_path']  # 模板路径
        if not det_info.template_path or not os.path.exists(RelatePath + det_info.template_path):
            det_info.template = cv2.imread(RelatePath + def_template_path)  # 模板
        else:
            det_info.template = cv2.imread(RelatePath + det_info.template_path)  # 模板
        return det_info


# 门状态结果类
class DoorDetResult:
    def __init__(self):
        self.uid = '',  # 门唯一ID
        self.door_state = DOOR_UNKNOWN  # 门状态
        self.ratio = 0.0  # 宽高比
        self.pts_str = ''  # 端点坐标拼接字符串
        self.img_name = ''  # 相关图片名称

    @classmethod
    def init(cls, uid, door_state, ratio, pts, img_name):
        result = DoorDetResult()
        result.uid = uid
        result.door_state = door_state
        result.ratio = ratio
        if pts is not None and len(pts) > 0:
            result.pts_str = str(pts)
        else:
            result.pts_str = ''
        result.img_name = img_name
        return result


# 将自定义的类转化为字典，dumps方法使用
def obj_to_dict(obj):
    # dct = {'__class__': obj.__class__.__name__, '__module__': obj.__module__}
    dct = {}
    dct.update(obj.__dict__)
    return dct


# 图像下采样
def sub_img(img, left, top, width, height):
    left = int(left)
    top = int(top)
    width = int(width)
    height = int(height)
    if left == 0 and top == 0 and img.shape[0] == height and img.shape[1] == width:
        return img
    if left >= 0 and top >= 0 and img.shape[0] >= top + height and img.shape[1] >= left + width:
        roi = img[top:top + height, left:left + width]
        return roi
    return img


# 图像特征匹配
def feature_matching(template, target, angle):
    # Initiate SIFT detector
    sift = cv2.SIFT_create()

    # find the key points and descriptors with SIFT
    kp1, des1 = sift.detectAndCompute(template, None)
    kp2, des2 = sift.detectAndCompute(target, None)

    # 创建设置FLANN匹配
    flann_index_kd_tree = 0
    index_params = dict(algorithm=flann_index_kd_tree, trees=5)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)

    # cv2.imwrite(img_save_path + "template.bmp", template)
    # cv2.imwrite(img_save_path + "target.bmp", target)
    matches = flann.knnMatch(des1, des2, k=2)

    # store all the good matches as per Lowe's ratio test
    good = []
    # min_lowe_ratio
    for m, n in matches:
        if m.distance < min_lowe_ratio * n.distance:
            good.append(m)

    dt_pts = []

    if len(good) >= min_match_point:
        logger.debug('Match Points: ' + str(len(good)))
        try:
            # 获取关键点的坐标
            src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)

            # 计算变换矩阵和MASK
            # 计算多个二维点对之间的最优单映射变换矩阵 H（3行x3列） ，使用最小均方误差或者RANSAC方法
            m, mask = cv2.findHomography(src_pts, dst_pts,
                                         cv2.RANSAC,  # 0, LMEDS, RANSAC, RHO
                                         5.0)  # 1到10，将点对视为内点的最大允许重投影错误阈值（仅用于RANSAC和RHO方法）

            h, w = template.shape[:2]
            # 使用得到的变换矩阵对原图像的四个角进行变换，获得在目标图像上对应的坐标
            pts = np.float32([[0, 0], [0, h - 1], [w - 1, h - 1], [w - 1, 0]]).reshape(-1, 1, 2)
            dst = cv2.perspectiveTransform(pts, m)

            dt_pts = np.int32(dst).ravel().tolist()

            # 预测目标的上边宽
            pre_t_width = abs(dst[3][0][0] - dst[0][0][0])
            # 预测目标的下边宽
            pre_b_width = abs(dst[2][0][0] - dst[1][0][0])
            # 预测目标的左边高
            pre_l_height = abs(dst[1][0][1] - dst[0][0][1])
            # 预测目标的右边高
            pre_r_height = abs(dst[2][0][1] - dst[3][0][1])

            # 预测目标的宽（中值）
            pre_width = (pre_t_width + pre_b_width) / 2
            # 预测目标的高（低值）
            pre_height = min(pre_l_height, pre_r_height)

            # 检查检测到的轮廓特征
            not_match = ''
            if abs(pre_t_width - pre_b_width) / pre_width > 0.1:
                not_match = 'Width NotMatch'
            elif abs(pre_l_height - pre_r_height) / pre_height > 0.2:
                not_match = 'Height NotMatch'
            elif abs(dst[1][0][0] - dst[0][0][0]) / pre_l_height > 0.2:
                not_match = 'Not Rectangle'

            if angle != 0:
                # 校正摄像头角度
                pre_width = float(pre_width * math.cos(np.pi * angle / 180))

            img = target.copy()
            if not_match:
                logger.warn('Contour Feature NotMatch: ' + not_match)
                res = DOOR_MIDDLE
                cv2.polylines(img, [np.int32(dst)], True, (0, 0, 255), 3, cv2.LINE_AA)
                ratio = 0
            else:
                pre_rate = pre_width / pre_height
                temp_rate = template.shape[1] / template.shape[0]
                ratio = pre_rate / temp_rate

                if ratio >= 0.85:
                    res = DOOR_CLOSED
                    cv2.polylines(img, [np.int32(dst)], True, (0, 255, 0), 3, cv2.LINE_AA)
                elif ratio >= 0.6:
                    res = DOOR_MIDDLE
                    cv2.polylines(img, [np.int32(dst)], True, (0, 0, 255), 3, cv2.LINE_AA)
                else:
                    res = DOOR_OPEN
                    cv2.polylines(img, [np.int32(dst)], True, (0, 255, 255), 3, cv2.LINE_AA)

            if draw_matches:
                match_mask = mask.ravel().tolist()  # 先将mask变成一维，再将矩阵转化为列表
                draw_params = dict(matchColor=(0, 255, 0),
                                   singlePointColor=(0, 0, 255),
                                   matchesMask=match_mask,
                                   flags=2)
                img = cv2.drawMatches(template, kp1, img, kp2, good, None, **draw_params)

            logger.info('W: {0}, LH:{1}, RH: {2}, R: {3}'.format(pre_width, pre_l_height, pre_r_height, ratio))
            if show_frame:
                cv2.imshow('result', img)

        except Exception as ex:
            logger.exception('Match Exception: ' + str(ex))
            res = DOOR_UNKNOWN
            img = target
            ratio = 0
    else:
        logger.warn('Match Points Lack: ' + str(len(good)))
        res = DOOR_OPEN
        img = target
        ratio = 0
        if show_frame:
            cv2.imshow('feature', img)

    return res, img, dt_pts, ratio


# 执行一次检测
def proc_det(camera, doors, rt_pipe, rt_rect):
    all_mask = [TmRender(TM_TYPE_WARN, "门未知", False), TmRender(TM_TYPE_INFO, "门开启", False),
                TmRender(TM_TYPE_INFO, "门半开", False), TmRender(TM_TYPE_INFO, "门关闭", False)]
    all_res = []
    door_count = len(doors)
    for i in range(door_count):
        all_res.append((doors[i].uid, [], [], [None], [None]))
    count = 0
    index = 0
    match_door = 0
    frame_skip = door_count * 2
    frame_rtmp = None
    while True:
        _, frame_org = camera.read()
        if frame_org is None:
            break
        if count % frame_skip == 0:
            count += 1
            continue
        if rt_pipe is not None or show_frame:
            frame_rtmp = frame_org.copy()
        for i in range(door_count):
            door = doors[i]
            door_res = all_res[i]
            if door_res[3][0] is None:
                roi = sub_img(frame_org, door.left[0], door.top[0], door.width[0], door.height[0])
                res, img, dt_pts, ratio = feature_matching(door.template, roi, door.camera_angle[0])
                if len(door_res[1]) <= index:
                    door_res[1].append(res)
                    door_res[2].append(ratio)
                else:
                    door_res[1][index] = res
                    door_res[2][index] = ratio
                m_count = 1
                len_res = len(door_res[1])
                if len_res > 1:
                    for j in range(0, len_res - 1):
                        if door_res[1][j] == res:
                            m_count += 1
                if m_count >= match_count:
                    door_res[3][0] = img
                    door_res[4][0] = dt_pts
                    match_door += 1
                    logger.info('Door{0} Loop Finish: {1}'.format(str(i), str(res)))
                if frame_rtmp is not None:
                    all_mask[res].render(frame_rtmp, [door.left[0] + int((door.width[0] - tm_mask_width) / 2),
                                                      door.top[0], tm_mask_width, tm_mask_height],
                                         m_count / match_count)
            elif frame_rtmp is not None:
                all_mask[door_res[1][-1]].render(frame_rtmp, [door.left[0] + int((door.width[0] - tm_mask_width) / 2),
                                                              door.top[0], tm_mask_width, tm_mask_height])

        if frame_rtmp is not None:
            if frame_rtmp.shape[1] != rt_rect[2] or frame_rtmp.shape[0] != rt_rect[3]:
                frame_rtmp = cv2.resize(frame_rtmp, (rt_rect[2], rt_rect[3]))
            if show_frame:
                cv2.imshow('result', frame_rtmp)
            if rt_pipe is not None:
                rt_pipe.stdin.write(frame_rtmp.tostring())

        if match_door >= door_count:
            break
        count += 1
        if count >= match_threshold:
            logger.warn('Loop Over Max Times: ' + str(match_threshold))
            break
        index += 1
        if index >= match_count:
            index = 0

        cv2.waitKey(10)
    return frame_org, all_res


show_frame = False
draw_matches = False
match_count = 4   # 监测的连续一致要求次数
match_threshold = 20   # 一轮监测的最大次数
min_lowe_ratio = 0.7   # 最低Lowe匹配比率
min_match_point = 10   # 最低特征点匹配数量
min_exc_seconds = 10    # 最小执行时间
def_template_path = 'resource/door_board.bmp'  # 默认模板路径

RelatePath = ''   # 基路径
if len(sys.argv) > 1:
    RelatePath = 'Command/Python/'
# video_source = 0    # 视频源
video_source = 'rtsp://admin:suncereltd123@172.16.2.79:554/Streaming/Channels/101'    # 视频源
img_save_path = RelatePath + 'result/'    # 相关图像保存路径

push_rtmp = False    # 是否推送视频流
rtmp_target = 'rtmp://202.104.69.206:18703/myapp/a25faff2d2504c0e8d981aa8f36ea5e3'    # 视频流推送地址
ffmpeg_path = RelatePath + 'resource/ffmpeg'

tm_mask_info = cv2.imread(RelatePath + 'resource/TipMaskInfo.bmp')
tm_mask_warn = cv2.imread(RelatePath + 'resource/TipMaskWarn.bmp')
tm_mask_error = cv2.imread(RelatePath + 'resource/TipMaskError.bmp')
tm_font_tips = ImageFont.truetype(RelatePath + 'resource/msyhbd.ttc', 20, encoding="utf-8")

tm_mask_width = tm_mask_info.shape[1]
tm_mask_height = tm_mask_info.shape[0]
tfm_keep_threshold = 10
tfm_keep_size = True

logger = Logger()

if __name__ == '__main__':
    try:
        all_info = []
        if len(sys.argv) > 1:
            args1 = base64.b64decode(sys.argv[1]).decode("ascii")
            logger.info(args1)
            dict_param = json.loads(args1)
            if "img_save_path" in dict_param:
                img_save_path = dict_param['img_save_path']
            if "video_source" in dict_param:
                video_source = dict_param['video_source']
                if len(video_source) <= 2:
                    video_source = int(video_source)
            if "min_exc_seconds" in dict_param:
                min_exc_seconds = int(dict_param['min_exc_seconds'])
            if "match_count" in dict_param:
                match_count = int(dict_param['match_count'])
            if "match_threshold" in dict_param:
                match_threshold = int(dict_param['match_threshold'])
            if "min_lowe_ratio" in dict_param:
                min_lowe_ratio = float(dict_param['min_lowe_ratio'])
            if "min_match_point" in dict_param:
                min_match_point = int(dict_param['min_match_point'])
            if "door_info" in dict_param:
                door_info = dict_param['door_info']
                for d_info in door_info:
                    if d_info is not None:
                        d_item = DoorDetInfo.init(d_info)
                        all_info.append(d_item)
            if "rtmp_target" in dict_param and len(dict_param['rtmp_target']) > 0:
                push_rtmp = True
                draw_matches = False
                rtmp_target = dict_param['rtmp_target']
            if "ffmpeg_path" in dict_param:
                ffmpeg_path = dict_param['ffmpeg_path']
            show_frame = False
        else:
            all_info.append(DoorDetInfo())

        # 监测结果类
        det_result = {
            "door_det_result": [],  # 门状态信息数组
            "img_name": ''  # 相关图像名称
        }
        if len(all_info) > 0:
            if not os.path.exists(img_save_path):
                os.makedirs(img_save_path)
            cap = cv2.VideoCapture(video_source)

            rtmp_pipe = None
            rtmp_rect = None
            if push_rtmp or show_frame:
                _, org_old_frame = cap.read()
                if org_old_frame is not None:
                    if org_old_frame.shape[1] >= 2560:
                        rtmp_rect = (0, 0, int(org_old_frame.shape[1] / 4), int(org_old_frame.shape[0] / 4))
                    elif org_old_frame.shape[1] >= 1280:
                        rtmp_rect = (0, 0, int(org_old_frame.shape[1] / 2), int(org_old_frame.shape[0] / 2))
                    else:
                        rtmp_rect = (0, 0, org_old_frame.shape[1], org_old_frame.shape[0])
                    if push_rtmp:
                        rtmp_size = str(rtmp_rect[2]) + 'x' + str(rtmp_rect[3])
                        command = [ffmpeg_path,
                                   '-y', '-an',
                                   '-f', 'rawvideo',
                                   '-vcodec', 'rawvideo',
                                   # '-vcodec', 'libx264',
                                   '-pix_fmt', 'bgr24',
                                   '-s', rtmp_size,
                                   '-r', '15',
                                   '-i', '-',
                                   '-c:v', 'libx264',
                                   '-pix_fmt', 'yuv420p',
                                   '-b:v', '4096K',
                                   '-preset', 'ultrafast',
                                   '-f', 'flv',
                                   rtmp_target]
                        rtmp_pipe = subprocess.Popen(command, shell=False, stdin=subprocess.PIPE)

            det_res = None
            frame = None
            time_start = datetime.datetime.now()
            for t in range(65535):
                frame, det_res = proc_det(cap, all_info, rtmp_pipe, rtmp_rect)
                run_seconds = (datetime.datetime.now() - time_start).seconds
                if run_seconds >= min_exc_seconds:
                    break
            for t in range(len(det_res)):
                d = det_res[t]
                if d[3] is None or d[3][0] is None:
                    det_result['door_det_result'].append(obj_to_dict(DoorDetResult.init(d[0][0], DOOR_UNKNOWN, 0.0,
                                                                                        [], None)))
                else:
                    ign = "{0}_d{1}.jpg".format(time.strftime("%y%m%d%H%M%S", time.localtime()), t)
                    cv2.imwrite(img_save_path + ign, d[3][0])
                    det_result['door_det_result'].append(obj_to_dict(DoorDetResult.init(d[0][0], d[1][-1],
                                                                                        round(d[2][-1], 3), d[4][0],
                                                                                        ign)))
            if frame is not None:
                det_result['img_name'] = "{0}_m.jpg".format(time.strftime("%y%m%d%H%M%S", time.localtime()))
                cv2.imwrite(img_save_path + det_result['img_name'], frame)
                print('bResult:' + base64.b64encode(json.dumps(det_result, ensure_ascii=False).encode('utf-8'))
                      .decode("ascii"), end='\n', flush=True)

            cv2.destroyAllWindows()
            cap.release()
    except Exception as e:
        logger.exception('Execute Error: ' + str(e))

