#!/usr/bin/python
# -*- coding: utf-8 -*-
import json
import os
import sys
import time
import base64
from math import *
import cv2
import logging
import logging.config

RelatePath = ''   # 基路径
if len(sys.argv) > 1:
    RelatePath = 'Command/Python/'


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


logger = Logger()

VideoIndex = 0
VideoSource = 'rtsp://admin:suncereltd123@172.16.2.79:554/Streaming/Channels/101'
DelayBusy = 25
DelayLazy = 25
FrmMax = 1500
Sensitivity = 0.99
SavePath = 'MoveCatch'

GaussianCore = 7
DiffThreshold = 5
ShowFrame = True

if len(sys.argv) > 7:
    VideoIndex = int(sys.argv[1])
    VideoSource = base64.b64decode(sys.argv[2]).decode("ascii")
    DelayBusy = int(sys.argv[3])
    DelayLazy = int(sys.argv[4])
    FrmMax = int(sys.argv[5])
    Sensitivity = float(sys.argv[6])
    SavePath = sys.argv[7]
    ShowFrame = False
    logger.info("Args VideoSource: " + VideoSource)


def GetMoveKeyFrame():
    try:
        nFrmNum = 0

        fResultPoint = 0.0
        timeStart = time.localtime()
        timeCatch = timeEnd = timeStart
        waitMs = DelayLazy
        keepCount = 0

        if cap is None:
            logger.error("Err: Video Capture")
            return False
        while True:
            if (nFrmNum >= FrmMax and keepCount <= 0) or nFrmNum >= FrmMax * 6 or cv2.waitKey(waitMs) > 0:
                break
            ret, pFrame = cap.read()
            if ShowFrame:
                pShow = pFrame
            # time.sleep(0.03)

            nFrmNum += 1
            keepCount -= 1
            # 如果是第一帧
            if nFrmNum == 1:
                fixWidth = fixHeight = 1
                orgHeight, orgWidth = pFrame.shape[:2]
                if orgWidth > 0 and orgHeight > 0:
                    dScaleX = 320.0 / orgWidth
                    dScaleY = 180.0 / orgHeight
                    if dScaleX <= dScaleY:
                        fixWidth = 320
                        fixHeight = int(orgHeight * dScaleX)
                        if fixHeight == 0:
                            fixHeight = 1
                    else:
                        fixWidth = int(orgWidth * dScaleY)
                        fixHeight = 180
                        if fixWidth == 0:
                            fixWidth = 1

                # 转化成单通道图像再处理
                fixSize = (fixWidth, fixHeight)
                pFixImage = cv2.cvtColor(cv2.resize(pFrame, fixSize), cv2.COLOR_BGR2GRAY)

                # 先做高斯滤波，以平滑图像
                pFixImage = cv2.GaussianBlur(pFixImage, (GaussianCore, GaussianCore), 0)

                pBkMat = pFixImage.copy()
                pResultImage = pFrame.copy()

            else:
                pFixImage = cv2.cvtColor(cv2.resize(pFrame, fixSize), cv2.COLOR_BGR2GRAY)

                pFixImage = cv2.GaussianBlur(pFixImage, (GaussianCore, GaussianCore), 0)
                pDiffMat = cv2.absdiff(pBkMat, pFixImage)

                # 二值化前景图
                pDiffMat = cv2.threshold(pDiffMat, DiffThreshold, 255, cv2.THRESH_BINARY)[1]

                pBkMat = pFixImage.copy()

                fCountWeight = CalcWeightMovePoints2(pDiffMat, 1 - Sensitivity)
                if fCountWeight > 0:
                    keepCount = 300
                    timeEnd = time.localtime()
                    if ShowFrame:
                        cv2.putText(pShow, "CountWeight: " + str(round(fCountWeight, 3)), (0, 30),
                                    cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255))
                if fResultPoint > 0:
                    if fCountWeight > fResultPoint:
                        fResultPoint = fCountWeight
                        timeCatch = timeEnd
                        pResultImage = pFrame.copy()
                        # if ShowFrame:
                        # cv2.putText(pShow, "CountWeight: " + str(round(fCountWeight, 3)), (0,30),
                        # cv2.FONT_HERSHEY_COMPLEX, 1.0, (255,255,255))
                else:
                    if fCountWeight > 0:
                        fResultPoint = fCountWeight
                        timeStart = timeEnd
                        timeCatch = timeEnd
                        pResultImage = pFrame.copy()
                        waitMs = DelayBusy

            if ShowFrame:
                cv2.imshow('Move Detect', pShow)

        if nFrmNum <= 0:
            logger.error("Err: Video No Frame")
            return False
        else:
            if fResultPoint > 0:
                cv2.imwrite(SavePath + '/ResultImage.jpg', pResultImage)
                cv2.waitKey(200)
                print("DT:{0};ST:{1};ET:{2};RP:{3}".format(time.strftime("%Y%m%d%H%M%S", timeCatch),
                                                           time.strftime("%Y%m%d%H%M%S", timeStart),
                                                           time.strftime("%Y%m%d%H%M%S", timeEnd),
                                                           fResultPoint), end='\n', flush=True)
            return True
    except Exception as ex:
        logger.exception('GetMoveKeyFrame Exception: ' + str(ex))
        return False


def CalcWeightMovePoints(img, ratio):
    fResult = 0.0
    fTotal = 0.0
    height, width = img.shape[:2]
    if height > 0 and width > 0:
        fRatioExtra = 2.0

        iRowCenter = height / 2
        iColCenter = width / 2

        fSizeLength = abs(sqrt(iRowCenter * iRowCenter + iColCenter * iColCenter))

        for row in range(height):
            fPowRow = (row - iRowCenter) * (row - iRowCenter)

            for col in range(width):
                fDistance = abs(sqrt(fPowRow + (col - iColCenter) * (col - iColCenter)))
                fPointFact = (fSizeLength - fDistance) / fSizeLength * fRatioExtra + 1

                fColor = img[row, col]
                fTotal += fPointFact
                if fColor > 0:
                    fResult += fPointFact
    if fResult >= fTotal * ratio:
        return fResult
    else:
        return 0.0


def CalcWeightMovePoints2(img, ratio):
    height, width = img.shape[:2]
    fTotal = height * width
    fResult = cv2.countNonZero(img)
    if fResult >= fTotal * ratio:
        return fResult
    else:
        return 0.0


# 从摄像头获取图像数据
cap = cv2.VideoCapture(VideoSource)
GetMoveKeyFrame()
cv2.waitKey(200)
cap.release()
