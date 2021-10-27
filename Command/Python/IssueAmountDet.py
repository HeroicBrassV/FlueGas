#!/usr/bin/python
# -*- coding: utf-8 -*-
import os
import time
import datetime
import math
import sys
import base64
import json
import subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont


# 旋转图像
def rotate_img(img, degree):
    height, width = img.shape[:2]
    # height_new = int(width * math.fabs(math.sin(math.radians(degree)))
    #                  + height * math.fabs(math.cos(math.radians(degree))))
    # width_new = int(height * math.fabs(math.sin(math.radians(degree)))
    #                 + width * math.fabs(math.cos(math.radians(degree))))

    mat_rotation = cv2.getRotationMatrix2D((width / 2, height / 2), degree, 1)

    # mat_rotation[0, 2] += (width_new - width) / 2
    # mat_rotation[1, 2] += (height_new - height) / 2

    img_rotation = cv2.warpAffine(img, mat_rotation, (width, height), borderValue=(0, 0, 0))
    return img_rotation


# 构建一帧识别框
def build_mask(c1_ratio, c3_ratio, only_c3):
    cp2 = m_mask2.copy()
    cp1 = rotate_img(m_mask1, c1_ratio)
    cp3 = rotate_img(m_mask3, c3_ratio)

    height2, width2 = cp2.shape[:2]
    height1, width1 = cp1.shape[:2]
    height3, width3 = cp3.shape[:2]

    y = int((height1-height2)/2)
    x = int((width1-width2)/2)
    cp1 = cp1[y:y+height2, x:x+width2]
    cp2 = cv2.addWeighted(cp2, 1, cp1, 1, 0)

    y = int((height3-height2)/2)
    x = int((width3-width2)/2)
    cp3 = cp3[y:y+height2, x:x+width2]
    cp2 = cv2.addWeighted(cp2, 1, cp3, 1, 0)
    if only_c3:
        return cp3
    else:
        return cp2


# 构建全部识别框帧
def init_masks(only_c3):
    m_list = []
    for x in range(60):
        m_list.append(build_mask(x, x % 3, only_c3))
    for x in range(60):
        y = 60 - x
        m_list.append(build_mask(y, x % 3, only_c3))
    return m_list


class AllRegionChara:
    def __init__(self):
        self.region_area = 0.0,  # 总区域面积
        self.region_len = 0.0,  # 总区域周长
        # self.area_len_ratio = 1.0,  # 总区域面积周长比
        self.contours_count = 0,  # 子轮廓数目
        self.v_area_ratio = 1.0,  # 左右半区面积比
        self.h_area_ratio = 1.0,  # 上下半区面积比
        self.m_region_area = 0.0,  # 主区域面积
        self.m_region_len = 0.0,  # 主区域周长
        # self.m_area_len_ratio = 1.0,  # 主区域面积周长比
        self.m_min_rect_width = 0.0,  # 主最小包覆斜矩形的宽
        self.m_min_rect_height = 0.0,  # 主最小包覆斜矩形的高
        # self.m_min_rect_ratio = 1.0,  # 主最小包覆斜矩形的宽高比
        # self.m_min_rect_area = 0.0,  # 主最小包覆斜矩形的面积
        self.m_min_rect_angle = 0.0,  # 主最小包覆斜矩形的角度
        self.m_bound_rect_width = 0.0,  # 主最小包覆正矩形的宽
        self.m_bound_rect_height = 0.0,  # 主最小包覆正矩形的高
        # self.m_bound_rect_ratio = 1.0,  # 主最小包覆正矩形的宽高比
        # self.m_bound_rect_area = 0.0,  # 主最小包覆正矩形的面积
        # self.m_bound_min_ratio = 1.0,  # 主最小包覆正矩形与斜矩形的面积比
        self.min_rect = None
        self.bound_rect = None

    def print(self):
        pass


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


# 获取主轮廓
def get_main_region(img):
    # 查找轮廓
    contours, hierarchy = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    img_main = np.zeros(img.shape, np.uint8)

    index = 0
    m_index = -1
    m_area = 0.0
    for contour in contours:
        index += 1
        # 计算该轮廓的面积
        area = float(cv2.contourArea(contour))
        # 面积小的都筛选掉
        if area < 20:
            continue

        if area > m_area:
            m_index = index - 1
            m_area = area

    if m_index >= 0:
        cv2.drawContours(img_main, contours, m_index, (255, 255, 255), -1)
        return img_main, contours[m_index]
    return img_main, None


# 获取流径轮廓信息
def get_region_info(contour, img_draw, org_width, org_height):
    characteristics = AllRegionChara()
    characteristics.contours_count = 0
    characteristics.region_area = 0.0

    if contour is None:
        return characteristics

    area = float(cv2.contourArea(contour))
    arc_len = cv2.arcLength(contour, True)

    if area < 20 or area > org_width * org_height * 0.5:
        return characteristics

    # 包覆此轮廓的最小斜矩形，该矩形有方向
    min_rect = cv2.minAreaRect(contour)
    # 包覆此轮廓的最小正矩形
    bound_rect = cv2.boundingRect(contour)

    width = min_rect[1][0]
    height = min_rect[1][1]
    ratio = float(width) / float(height)

    scale = min_rect_scale
    if min_rect[2] > 0:
        scale = 1 / scale
    if scale < 1:    # 左方排水
        if ratio > scale:
            return characteristics
    elif scale > 1:    # 右方排水
        if ratio < scale:
            return characteristics

    angle = abs(min_rect[2])
    if angle < min_rect_angle or angle > 90 - min_rect_angle:
        return characteristics

    max_len = max(width, height)
    if max_len < 5 or float(max_len) < float(org_height) * min_rect_len_ratio:
        return characteristics

    characteristics.m_min_rect_width = width
    characteristics.m_min_rect_height = height
    # characteristics.m_min_rect_ratio = ratio
    # m_min_area = width * height
    # characteristics.m_min_rect_area = m_min_area
    characteristics.m_min_rect_angle = min_rect[2]
    characteristics.min_rect = min_rect

    width = bound_rect[2]
    height = bound_rect[3]
    # ratio = float(width) / float(height)
    characteristics.m_bound_rect_width = width
    characteristics.m_bound_rect_height = height
    # characteristics.m_bound_rect_ratio = ratio
    # m_bound_area = width * height
    # characteristics.m_bound_rect_area = m_bound_area
    # characteristics.m_bound_min_ratio = m_bound_area / m_min_area
    characteristics.bound_rect = bound_rect

    characteristics.contours_count = 1
    characteristics.region_area = area
    characteristics.region_len = arc_len
    # characteristics.area_len_ratio = t_area / t_len

    characteristics.m_region_area = area
    characteristics.m_region_len = arc_len
    # characteristics.m_area_len_ratio = area / arc_len

    assert img_draw is not None
    '''
    height, width = img_draw.shape[0], img_draw.shape[1]
    img_left = sub_img(img_draw, 0, 0, width / 2, height)
    img_right = sub_img(img_draw, width / 2, 0, width / 2, height)
    img_top = sub_img(img_draw, 0, 0, width, height / 2)
    img_bottom = sub_img(img_draw, 0, height / 2, width, height / 2)

    count = cv2.countNonZero(img_right)
    if count > 0:
        characteristics.v_area_ratio = cv2.countNonZero(img_left) / count
    else:
        characteristics.v_area_ratio = 999
    count = cv2.countNonZero(img_bottom)
    if count > 0:
        characteristics.h_area_ratio = cv2.countNonZero(img_top) / count
    else:
        characteristics.h_area_ratio = 999
    '''
    # cv2.im show("counts", img_contours)
    return characteristics


def get_best_index(info_array):
    index_main = 0
    chara_main = info_array[0][2]
    if chara_main.contours_count <= 0:
        ratio_main = 1
    elif chara_main.m_min_rect_width > chara_main.m_min_rect_height:
        ratio_main = float(chara_main.m_min_rect_width) / float(chara_main.m_min_rect_height)
    else:
        ratio_main = float(chara_main.m_min_rect_height) / float(chara_main.m_min_rect_width)
    for i in range(1, repeat_times):
        chara = info_array[i][2]
        if chara.contours_count <= 0:
            continue
        elif chara.m_min_rect_width > chara.m_min_rect_height:
            ratio = float(chara.m_min_rect_width) / float(chara.m_min_rect_height)
            if ratio > ratio_main:
                index_main = i
                ratio_main = ratio
        else:
            ratio = float(chara.m_min_rect_height) / float(chara.m_min_rect_width)
            if ratio > ratio_main:
                index_main = i
                ratio_main = ratio
    return index_main


# 图像旋转矩形转正
def crop_rect(img, rect):
    center, size, angle = rect[0], rect[1], rect[2]
    center, size = tuple(map(int, center)), tuple(map(int, size))

    height, width = img.shape[0], img.shape[1]

    m = cv2.getRotationMatrix2D(center, angle, 1)
    img_rot = cv2.warpAffine(img, m, (width, height))

    img_crop = cv2.getRectSubPix(img_rot, size, center)

    assert size[0] == img_crop.shape[1] and size[1] == img_crop.shape[0]
    # cv2.imshow('img_crop', img_crop)
    return img_rot, img_crop


def cal_issue_amount(gray, contour, chara, ratio):
    if ratio <= 0:
        return 0
    if contour is None:
        return 0
    if chara.contours_count <= 0:
        return 0
    _, crop = crop_rect(gray, chara.min_rect)
    height, width = crop.shape[0], crop.shape[1]
    if height > width:
        le = height / 2
        roi = sub_img(crop, 0, 5, width, le)
    else:
        le = width / 2
        roi = sub_img(crop, 5, 0, le, height)
    r = (ratio * cv2.countNonZero(roi)) / (2 * le)
    fact_height = ratio * float(chara.m_bound_rect_height) / math.cos(math.radians(hor_angle))
    t = math.sqrt(2 * fact_height / 9.8)
    sp = ratio * float(chara.m_bound_rect_width) / t
    if ver_angle != 0:
        sp *= math.cos(math.radians(ver_angle))
    m3_s = np.pi * r * r * sp
    l_min = m3_s * 60000
    return l_min


def get_hue_name(hue):
    if hue <= 20:
        return '红'
    elif hue <= 50:
        return '橙'
    elif hue <= 75:
        return '黄'
    elif hue <= 150:
        return '绿'
    elif hue <= 200:
        return '蓝'
    elif hue <= 230:
        return '青'
    elif hue <= 250:
        return '靛'
    elif hue <= 340:
        return '紫'
    else:
        return '红'


def cal_water_quantity(img_color, mask_gray, contour, chara):
    if contour is None:
        return None
    if chara.contours_count <= 0:
        return None
    _, crop = crop_rect(mask_gray, chara.min_rect)
    _, crop_color = crop_rect(img_color, chara.min_rect)
    height, width = crop.shape[0], crop.shape[1]
    if height > width:
        roi = sub_img(crop, 0, 5, width, int(height * 0.7))
        roi_color = sub_img(crop_color, 0, 5, width, int(height * 0.7))
    else:
        roi = sub_img(crop, 5, 0, int(width * 0.7), height)
        roi_color = sub_img(crop_color, 5, 0, int(width * 0.7), height)
    count_total = cv2.countNonZero(roi)
    if count_total < 10:
        return None

    img_hsv = cv2.cvtColor(roi_color, cv2.COLOR_RGB2HSV)
    img_hue, img_saturation, img_value = cv2.split(img_hsv)

    img_saturation_fix = img_saturation[roi > 0]
    img_hue_fix = img_hue[roi > 0]
    img_value_fix = img_value[roi > 0]

    sort_saturation = np.argsort(255 - img_saturation_fix)
    count_saturation = int(count_total / 4)
    sat_sat = img_saturation_fix[sort_saturation][0:count_saturation]
    mean_sat = int(np.mean(sat_sat) * 100 / 255)
    sat_hue = img_hue_fix[sort_saturation][0:count_saturation]
    mean_hue = int(np.mean(sat_hue)) * 2
    if 100 < mean_hue < 230:
        l1_min = 10
        l2_min = 30
    else:
        l1_min = 5
        l2_min = 25
    if mean_sat < l1_min:
        name_color = '无色'
        level_hue = 0
    elif mean_sat <= l2_min:
        name_color = '偏' + get_hue_name(mean_hue)
        level_hue = (mean_sat - l1_min) / 10 + 1
    else:
        name_color = get_hue_name(mean_hue) + '色'
        level_hue = (mean_sat - l2_min) / 30 + 4

    mean_value = int(np.mean(img_value_fix) * 100 / 255)
    if mean_value >= 60:
        level_value = 0
    else:
        level_value = (60 - mean_value) / 10

    return name_color, int(max(level_hue, level_value))


def result_out(frame_org, frame, current_gray, rgb):
    assert frame.shape[1] == current_gray.shape[1] == rgb.shape[1]
    assert frame.shape[0] == current_gray.shape[0] == rgb.shape[0]
    height, width, = frame.shape[0:2]
    t_height = height * 3
    t_width = width + int(frame_org.shape[1] * t_height / frame_org.shape[0])
    img = np.zeros((t_height, t_width, 3), np.uint8)
    img[0:height, 0:width] = frame
    img[height:height*2, 0:width] = cv2.cvtColor(current_gray, cv2.COLOR_GRAY2BGR)
    img[height*2:height*3, 0:width] = rgb
    img[0:t_height, width:t_width] = cv2.resize(frame_org, (t_width - width, t_height), cv2.INTER_AREA)
    # 保存图像，输出结果
    cv2.imwrite(img_save_path + dict_result['img_name'], img)
    print('bResult:' + base64.b64encode(json.dumps(dict_result, ensure_ascii=False).encode('utf-8'))
          .decode("ascii"), end='\n', flush=True)


def get_rtmp_rect(org_frame):
    x = int(rect_left + rect_width / 2 - rtmp_width_limit / 2)
    y = int(rect_top + rect_height / 2 - rtmp_height_limit / 2)
    if x < 0:
        x = 0
    if y < 0:
        y = 0
    x_to = x + rtmp_width_limit
    y_to = y + rtmp_height_limit
    if x_to > org_frame.shape[1]:
        x_to = org_frame.shape[1]
    if y_to > org_frame.shape[0]:
        y_to = org_frame.shape[0]
    return x, y, x_to - x, y_to - y


def det_issue(video_path):
    cap = cv2.VideoCapture(video_path)
    # 获取第一帧
    _, org_old_frame = cap.read()
    if rotate_frame:
        org_old_frame = cv2.rotate(org_old_frame, 0)
    # org_old_frame = sub_img(org_old_frame, 0, 200, org_old_frame.shape[1], int(org_old_frame.shape[1] * 0.8))

    rtmp_rect = get_rtmp_rect(org_old_frame)

    rtmp_pipe = None
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

    old_frame = sub_img(org_old_frame, rect_left, rect_top, rect_width, rect_height)
    if small_ratio != 1:
        old_frame = cv2.resize(old_frame, (0, 0), fx=small_ratio, fy=small_ratio)

    mask_fact = []
    mask_fact_yes = []
    mask_fact_no = []
    mask_ext = int(mask_border * rect_width / (mask_width - mask_border - mask_border))
    if rect_top - mask_ext > 0 and rect_left - mask_ext > 0 and org_old_frame.shape[0] > rect_top + rect_height + \
            mask_ext and org_old_frame.shape[1] > rect_left + rect_width + mask_ext:
        for mask in mask_list:
            mask_fact.append(cv2.resize(mask, (rect_width + mask_ext * 2, rect_height + mask_ext * 2)))
            pil_im1 = Image.fromarray(cv2.cvtColor(mask, cv2.COLOR_BGR2RGB))
            pil_im2 = Image.fromarray(cv2.cvtColor(mask, cv2.COLOR_BGR2RGB))
            draw1 = ImageDraw.Draw(pil_im1)
            draw1.text((mask.shape[0] - 130, 70), "排水中", 'white', font=font_cap)
            mask1 = cv2.cvtColor(np.asarray(pil_im1), cv2.COLOR_RGB2BGR)
            mask_fact_yes.append(cv2.resize(mask1, (rect_width + mask_ext * 2, rect_height + mask_ext * 2)))
            draw2 = ImageDraw.Draw(pil_im2)
            draw2.text((mask.shape[0] - 130, 70), "未排水", 'white', font=font_cap)
            mask2 = cv2.cvtColor(np.asarray(pil_im2), cv2.COLOR_RGB2BGR)
            mask_fact_no.append(cv2.resize(mask2, (rect_width + mask_ext * 2, rect_height + mask_ext * 2)))

    # 光流示意色图
    hsv = np.zeros_like(old_frame)
    hsv[..., 1] = 255  # 饱和度

    old_gray = cv2.cvtColor(old_frame, cv2.COLOR_BGR2GRAY)
    current_gray = np.zeros(old_gray.shape, np.uint8)
    ang_mask = np.zeros(old_gray.shape, np.uint8)
    issue_mag = []
    issue_grays = []
    issue_count = []
    for i in range(0, comp_count):
        issue_mag.append(np.zeros_like(old_gray))
        issue_grays.append(np.zeros_like(old_gray))
        issue_count.append(0)
    times_info = []
    for i in range(0, repeat_times):
        times_info.append((None, None, None))

    issue_info = None
    quantity_info = None

    # 膨胀和腐蚀参数
    element1 = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    element2 = cv2.getStructuringElement(cv2.MORPH_RECT, (13, 13))

    count = 0
    times = 0
    circles = 0
    mask_index = 0
    frame_org = None
    frame = None
    rgb = None
    time_start = datetime.datetime.now()
    while True:
        _, next_frame_org = cap.read()
        if next_frame_org is None:
            break
        if rotate_frame:
            frame_org = cv2.rotate(next_frame_org, 0)
        else:
            frame_org = next_frame_org
        # frame_org = sub_img(frame_org, 0, 200, frame_org.shape[1], int(frame_org.shape[1] * 0.8))
        frame_rect = sub_img(frame_org, rect_left, rect_top, rect_width, rect_height)
        if small_ratio != 1:
            frame = cv2.resize(frame_rect, (0, 0), fx=small_ratio, fy=small_ratio)
        else:
            frame = frame_rect
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # 返回一个两通道的光流向量，实际上是每个点的像素位移值
        flow = cv2.calcOpticalFlowFarneback(old_gray, frame_gray, None,
                                            0.5,    # 构建图像金字塔尺度
                                            5,    # 图像金字塔层数
                                            5,    # 窗口尺寸，值越大探测高速运动的物体越容易，但是越模糊，同时对噪声的容错性越强
                                            3,    # 对每层金字塔的迭代次数
                                            8,    # 每个像素中找到多项式展开的邻域像素的大小。越大越光滑，也越稳定
                                            2.0,    # 高斯标准差，用来平滑倒数
                                            cv2.OPTFLOW_FARNEBACK_GAUSSIAN)    # 光流的方式

        # 笛卡尔坐标转换为极坐标，获得极轴和极角
        mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        hsv[..., 0] = ang * 180 / np.pi / 2  # 色调
        hsv[..., 2] = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)  # 亮度
        rgb = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        # cv2.imshow('rgb', rgb)

        # mag[mag < 0.1] = 0
        gray = cv2.normalize(mag, None, 0, 1, cv2.NORM_MINMAX)

        if count > comp_count:
            temp = mag * ang
            temp[mag < 0.1] = -999
            temp[ang_mask == 0] = -999
            mean = np.mean(temp > -999)
            temp_range = max(abs(mean * 3), 1.5)
            temp[:] = (temp_range - abs(temp[:] - mean)) / temp_range
            temp[temp < 0] = 0
            # 膨胀一次，让轮廓突出
            temp = cv2.dilate(temp, element1, iterations=1)
            # 腐蚀一次，去掉细小杂点
            temp = cv2.erode(temp, element2, iterations=1)
            # 再次膨胀，让轮廓更明显
            temp = cv2.dilate(temp, element1, iterations=1)
            ang_gray = cv2.normalize(temp, None, 0, 0.5, cv2.NORM_MINMAX)
            gray = gray * (1 + ang_gray)
            gray = cv2.normalize(gray, None, 0, 1, cv2.NORM_MINMAX)

        for i in range(0, comp_count):
            issue_mag[i] = issue_mag[i] + mag
            issue_grays[i] = issue_grays[i] + gray
            issue_count[i] = issue_count[i] + 1

        temp_gray = issue_grays[count % comp_count].copy()
        min_value = issue_count[count % comp_count] * 0.005
        temp_gray[mag < min_value] = 0
        temp_gray = cv2.GaussianBlur(temp_gray, (5, 5), 0, 0, cv2.BORDER_DEFAULT)
        temp_gray = cv2.medianBlur(temp_gray, 5)
        temp_gray = cv2.normalize(temp_gray, None, 0, 1, cv2.NORM_MINMAX)
        temp_gray = cv2.threshold(temp_gray, threshold_ratio, 1, cv2.THRESH_BINARY)[1]
        current_gray[:] = temp_gray[:]
        ang_mask = get_main_region(current_gray)

        # 膨胀一次，让轮廓突出
        current_gray = cv2.dilate(current_gray, element1, iterations=1)
        # 腐蚀一次，去掉细小杂点
        current_gray = cv2.erode(current_gray, element2, iterations=1)
        # 再次膨胀，让轮廓更明显
        current_gray = cv2.dilate(current_gray, element1, iterations=1)
        current_gray, m_contour = get_main_region(current_gray)

        if count >= comp_count and count % 5 == 0:
            characteristics = get_region_info(m_contour, current_gray, old_gray.shape[1], old_gray.shape[0])
            # noinspection PyTypeChecker
            # print(str(characteristics.contours_count > 0) + ',' + str(characteristics.region_area))
            times_info[times % repeat_times] = (current_gray, m_contour, characteristics)
            times += 1
            if times >= repeat_times:
                index = get_best_index(times_info)
                t_info = times_info[index]
                # noinspection PyTypeChecker
                issue_new = cal_issue_amount(t_info[0], t_info[1], t_info[2], issue_ratio)
                # print(issue_new)
                if issue_info is None or issue_new is None:
                    issue_info = issue_new
                else:
                    issue_info = issue_info * 0.8 + issue_new * 0.2
                circles += 1
                if circles >= repeat_circles and (circles % repeat_circles) == 0 and issue_new is not None:
                    # noinspection PyTypeChecker
                    quantity_info = cal_water_quantity(frame, t_info[0], t_info[1], t_info[2])
                    if quantity_info is not None and not dict_result['is_issue']:
                        dict_result['is_issue'] = True
                        dict_result['issue_l_min'] = round(issue_info, 3)
                        dict_result['color_desc'] = quantity_info[0]
                        dict_result['dimness_level'] = quantity_info[1]
                        dict_result['img_name'] = "{0}_{1}_Is{2}x{3}.jpg".format(
                            time.strftime("%y%m%d%H%M%S", time.localtime()),
                            circles, frame.shape[1], frame.shape[0])
                        result_out(frame_org, frame, current_gray, rgb)

        issue_mag[count % comp_count][:] = 0
        issue_grays[count % comp_count][:] = 0
        issue_count[count % comp_count] = 0

        frame_show = frame_org.copy()

        if small_ratio != 1:
            show_mask = cv2.resize(current_gray, (0, 0), fx=1/small_ratio, fy=1/small_ratio)
        else:
            show_mask = current_gray.copy()
        show_mask = cv2.cvtColor(show_mask, cv2.COLOR_GRAY2BGR)
        if issue_info is not None and issue_info > 0:
            show_mask[:, :, 0:2] = 0
            frame_rect = cv2.addWeighted(frame_rect, 1, show_mask, 0.15, 0)
        # else:
        #     frame_rect = cv2.addWeighted(frame_rect, 1, show_mask, 0.15, 0)
        if issue_info is not None:
            pil_im = Image.fromarray(cv2.cvtColor(frame_rect, cv2.COLOR_BGR2RGB))
            draw = ImageDraw.Draw(pil_im)
            draw.text((frame_rect.shape[0] - 70, 50), "{:.0f} L/min".format(issue_info), (255, 255, 255),
                      font=font_text)
            if quantity_info is not None:
                draw.text((frame_rect.shape[0] - 20, 70), quantity_info[0], (255, 255, 255),
                          font=font_text)
                draw.text((frame_rect.shape[0] - 20, 90), 'Lv' + str(quantity_info[1]), (255, 255, 255),
                          font=font_text)
            frame_rect = cv2.cvtColor(np.asarray(pil_im), cv2.COLOR_RGB2BGR)
            # cv2.putText(frame_rect, "{:.0f}".format(issue_info), (frame_rect.shape[0] - 70, 80),
            #             cv2.FONT_HERSHEY_TRIPLEX, 0.5, (255, 255, 255))
        if frame_show.shape[0] >= rect_top+rect_height and frame_show.shape[1] >= rect_left+rect_width:
            frame_show[rect_top:rect_top+rect_height, rect_left:rect_left+rect_width] = frame_rect

        mask_len = len(mask_fact)
        if mask_len > 0:
            mask_index += 1
            roi_draw = frame_show[rect_top - mask_ext:rect_top + rect_height + mask_ext,
                                  rect_left - mask_ext:rect_left + rect_width + mask_ext]
            if issue_info is None:
                mask = mask_fact[mask_index % mask_len]
            elif issue_info > 0:
                mask = mask_fact_yes[mask_index % mask_len]
            else:
                mask = mask_fact_no[mask_index % mask_len]
            img_draw = cv2.addWeighted(roi_draw, 1, mask, 0.4, 0)
            frame_show[rect_top - mask_ext:rect_top + rect_height + mask_ext,
                       rect_left - mask_ext:rect_left + rect_width + mask_ext] = img_draw

        if rtmp_pipe is not None:
            # if count % 2 == 0:
            frame_rtmp = sub_img(frame_show, rtmp_rect[0], rtmp_rect[1], rtmp_rect[2], rtmp_rect[3])
            rtmp_pipe.stdin.write(frame_rtmp.tostring())
        elif show_frame:
            cv2.imshow('frame', frame_show)

        count += 1
        run_seconds = (datetime.datetime.now() - time_start).seconds
        if run_seconds >= max_exc_seconds:
            break
        if quantity_info is not None and run_seconds >= min_exc_seconds:
            break
        cv2.waitKey(10)
        # if cv2.waitKey(10) & 0xff == ord('q'):
        #     break
        old_gray = frame_gray

    if quantity_info is None and rgb is not None:
        # 保存图像，输出结果
        dict_result['img_name'] = "{0}_{1}_IsN{2}x{3}.jpg".format(
            time.strftime("%y%m%d%H%M%S", time.localtime()),
            circles, frame.shape[1], frame.shape[0])
        result_out(frame_org, frame, current_gray, rgb)

    cv2.destroyAllWindows()
    cap.release()
    if rtmp_pipe is not None:
        rtmp_pipe.terminate()


rect_left, rect_top, rect_width, rect_height = 380, 760, 220, 200    # 关注区域
fact_width = 0.8    # 关注区域实际宽度（米）
ver_angle = 0    # 摄像头垂直（左右）倾角
hor_angle = 30    # 摄像头水平（上下）倾角
small_ratio = 0.5    # 关注区域流轨提取处理缩放比率
min_rect_scale = 0.5    # 轮廓的最小斜矩形宽高比例阈值，左方排水典型为0.5，右方排水为2
min_rect_angle = 15    # 轮廓的最小斜矩形有效倾斜角范围，值15为倾斜角在-15至-75度之间有效
min_rect_len_ratio = 0.5    # 轮廓的最小斜矩形长边与关注区域高度比
threshold_ratio = 0.5    # 流轨提取末段的二值化阈值
comp_count = 30    # 流轨提取帧叠加次数
repeat_times = 3    # 排量判断次数
repeat_circles = 10    # 水质判断轮数
issue_extra_ratio = 1.0    # 流量额外系数
issue_ratio = issue_extra_ratio * fact_width / rect_width    # 流量实际系数

rotate_frame = False
show_frame = True
push_rtmp = False    # 是否推送视频流
rtmp_target = 'rtmp://202.104.69.206:18703/myapp/a25faff2d2504c0e8d981aa8f36ea5e3'    # 视频流推送地址
rtmp_width_limit = 800    # 视频流推送最大宽度
rtmp_height_limit = 600    # 视频流推送最大高度
max_exc_seconds = 20    # 最大执行时间
min_exc_seconds = 15    # 最小执行时间

RelatePath = ''
if len(sys.argv) > 1:
    RelatePath = 'Command/Python/'
img_save_path = RelatePath + 'result/'    # 相关图像保存路径
video_source = RelatePath + 'dataset/VID_20210914_112910.mp4'
# video_source = 'rtsp://admin:suncereltd123@172.16.3.229:554/Streaming/Channels/103'
# video_source = 'rtsp://admin:LJOAKL@172.16.3.120:554/Streaming/Channels/102'
ffmpeg_path = RelatePath + 'resource/ffmpeg'

font_cap = ImageFont.truetype(RelatePath + 'resource/msyhbd.ttc', 20, encoding="utf-8")
font_text = ImageFont.truetype(RelatePath + 'resource/msyhbd.ttc', 16, encoding="utf-8")

m_mask = cv2.imread(RelatePath + 'resource/Mask.bmp')
m_mask1 = cv2.imread(RelatePath + 'resource/Mask1.bmp')
m_mask2 = cv2.imread(RelatePath + 'resource/Mask2.bmp')
m_mask3 = cv2.imread(RelatePath + 'resource/Mask3.bmp')
mask_width = m_mask.shape[1]
mask_border = 50
mask_list = init_masks(True)

if len(sys.argv) > 1:
    args1 = base64.b64decode(sys.argv[1]).decode("ascii")
    # print(args1, end='\n', flush=True)
    dict_param = json.loads(args1)
    rect_left = int(dict_param['rect_left'])
    rect_top = int(dict_param['rect_top'])
    rect_width = int(dict_param['rect_width'])
    rect_height = int(dict_param['rect_height'])
    fact_width = float(dict_param['fact_width'])
    if "ver_angle" in dict_param:
        ver_angle = float(dict_param['ver_angle'])
    if "hor_angle" in dict_param:
        hor_angle = float(dict_param['hor_angle'])
    if "small_ratio" in dict_param:
        small_ratio = float(dict_param['small_ratio'])
    if "min_rect_scale" in dict_param:
        min_rect_scale = float(dict_param['min_rect_scale'])
    if "min_rect_angle" in dict_param:
        min_rect_angle = int(dict_param['min_rect_angle'])
    if "min_rect_len_ratio" in dict_param:
        min_rect_len_ratio = float(dict_param['min_rect_len_ratio'])
    if "threshold_ratio" in dict_param:
        threshold_ratio = float(dict_param['threshold_ratio'])
    if "comp_count" in dict_param:
        comp_count = int(dict_param['comp_count'])
    if "repeat_times" in dict_param:
        repeat_times = int(dict_param['repeat_times'])
    if "repeat_circles" in dict_param:
        repeat_circles = int(dict_param['repeat_circles'])
    if "issue_extra_ratio" in dict_param:
        issue_extra_ratio = float(dict_param['issue_extra_ratio'])
    if "rtmp_target" in dict_param and len(dict_param['rtmp_target']) > 0:
        push_rtmp = True
        rtmp_target = dict_param['rtmp_target']
    if "max_exc_seconds" in dict_param:
        max_exc_seconds = int(dict_param['max_exc_seconds'])
    if "min_exc_seconds" in dict_param:
        min_exc_seconds = int(dict_param['min_exc_seconds'])
    if "img_save_path" in dict_param:
        img_save_path = dict_param['img_save_path']
    if "video_source" in dict_param:
        video_source = dict_param['video_source']
    if "ffmpeg_path" in dict_param:
        ffmpeg_path = dict_param['ffmpeg_path']
    show_frame = False

if video_source.endswith('.mp4'):
    rotate_frame = True

dict_result = {
    "is_issue": False,    # 是否在排水
    "issue_l_min": 0.0,    # 流量
    "color_desc": '',    # 色相描述
    "dimness_level": 0,    # 浊度等级
    "img_name": ''    # 相关图像名称
}

if not os.path.exists(img_save_path):
    os.makedirs(img_save_path)

# Main
det_issue(video_source)
