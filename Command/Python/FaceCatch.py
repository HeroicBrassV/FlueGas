#!/usr/bin/python
# -*- coding: utf-8 -*-
import sys, os, time
import threading
import numpy as np
from math import *
import cv2

VideoIndex = 0
MinFaceSize = 100
FaceCatch = 1
EyeCatch = 1
WindowX = 0
WindowY = 0
FrmMax = 200
RelatePath = ''
SavePath = 'FaceCatch'

if len(sys.argv) > 9:
    VideoIndex = int(sys.argv[1])
    MinFaceSize = int(sys.argv[2])
    FaceCatch = int(sys.argv[3])
    EyeCatch = int(sys.argv[4])
    WindowX = int(sys.argv[5])
    WindowY = int(sys.argv[6])
    FrmMax = int(sys.argv[7])
    RelatePath = sys.argv[8]
    SavePath = sys.argv[9]

# 从摄像头获取图像数据
cap = cv2.VideoCapture(VideoIndex)
cv2.namedWindow("FaceCatch", cv2.WINDOW_AUTOSIZE);
cv2.moveWindow("FaceCatch", WindowX, WindowY)
face_cascade = cv2.CascadeClassifier(RelatePath + 'haarcascades/haarcascade_frontalface_alt.xml')
eye_cascade = cv2.CascadeClassifier(RelatePath + 'haarcascades/haarcascade_eye_tree_eyeglasses.xml')
mask = cv2.imread(RelatePath + "resource/Mask.bmp")
mask1 = cv2.imread(RelatePath + "resource/Mask1.bmp")
mask2 = cv2.imread(RelatePath + "resource/Mask2.bmp")
mask3 = cv2.imread(RelatePath + "resource/Mask3.bmp")
mask_with = mask.shape[1]
mask_border = 50

# 旋转图像
def rotateImg(img, degree):
    height,width=img.shape[:2]
    # heightNew=int(width*fabs(sin(radians(degree)))+height*fabs(cos(radians(degree))))
    # widthNew=int(height*fabs(sin(radians(degree)))+width*fabs(cos(radians(degree))))
 
    matRotation=cv2.getRotationMatrix2D((width/2,height/2),degree,1)
 
    # matRotation[0,2] +=(widthNew-width)/2
    # matRotation[1,2] +=(heightNew-height)/2
 
    imgRotation=cv2.warpAffine(img,matRotation,(width,height),borderValue=(0,0,0))
    return imgRotation

# 构建一帧识别框
def buildMask(c1Ratio, c3Ratio):
    cp2 = mask2.copy()
    cp1 = rotateImg(mask1, c1Ratio)
    cp3 = rotateImg(mask3, c3Ratio)

    height2,width2=cp2.shape[:2]
    height1,width1=cp1.shape[:2]
    height3,width3=cp3.shape[:2]

    y = int((height1-height2)/2)
    x = int((width1-width2)/2)
    cp1 = cp1[y:y+height2, x:x+width2]
    cp2 = cv2.addWeighted(cp2, 1, cp1, 1, 0)

    y = int((height3-height2)/2)
    x = int((width3-width2)/2)
    cp3 = cp3[y:y+height2, x:x+width2]
    cp2 = cv2.addWeighted(cp2, 1, cp3, 1, 0)
    return cp2

# 构建全部识别框帧
def initMasks():
    for x in range(60):
        mask_list.append(buildMask(x, x%3))
    for x in range(60):
        y = 60 - x
        mask_list.append(buildMask(y, x%3))
    return

mask_list = []
initMasks()
mask_index = 0

last_x = 0
last_y = 0
last_w = 0
last_h = 0
keepThreshold = 3
nFrmNum = 0;
countCatch = 1

# 异步读取控制台输入
class InputThread(threading.Thread):
    def run(self):
        self.last_user_input = ""
        self.toNext = True
        self.toExit = False
        while True:
            self.last_user_input = input()
            if self.last_user_input == "n":
                self.toNext = True
            elif self.last_user_input == "q":
                self.toExit = True
                break

it = InputThread()
it.start()

while(True):
    cv2.waitKey(1)
    if nFrmNum >= FrmMax or it.toExit:
        break
    
    # 读取一帧数据
    nFrmNum += 1
    ret,frame = cap.read()
    frame = cv2.flip(frame, 1)
    frameBak = frame.copy()
    # 变为灰度图
    gray = cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
    #cv2.equalizeHist(gray)
    #级联分类器进行人脸识别
    rects=face_cascade.detectMultiScale(gray,scaleFactor=1.1,minNeighbors=3,minSize=(MinFaceSize,MinFaceSize),flags=cv2.CASCADE_SCALE_IMAGE)

    mask_fact = mask_list[mask_index]
    mask_index += 1
    if mask_index == len(mask_list):
        mask_index = 0

    first = False
    for (x,y,w,h) in rects:
        if FaceCatch == 1 and rects.shape[0] > 1:
            continue
        if(first == False):
            first = True
        if(abs(x-last_x)<keepThreshold and abs(y-last_y)<keepThreshold and abs(w-last_w)<keepThreshold and abs(h-last_h)<keepThreshold):
            x = last_x
            y = last_y
            w = last_w
            h = last_h
        last_x = x
        last_y = y
        last_w = w
        last_h = h

        roi_gray = gray[y:y+h, x:x+w]

        eyes = eye_cascade.detectMultiScale(roi_gray,scaleFactor=1.1,minNeighbors=2,minSize=(30,30),flags=cv2.CASCADE_SCALE_IMAGE)

        mask_ext = int(mask_border * w / (mask_with - mask_border - mask_border))
        if y-mask_ext > 0 and x-mask_ext > 0 and frame.shape[0] > y+h+mask_ext and frame.shape[1] > x+w+mask_ext:
            roi_draw = frame[y-mask_ext:y+h+mask_ext, x-mask_ext:x+w+mask_ext]
            img_draw = cv2.resize(mask_fact, (roi_draw.shape[1], roi_draw.shape[0]))
            count_eye = 0
            for (ex,ey,ew,eh) in eyes:
               count_eye += 1
               # cv2.circle(img_draw,(ex+mask_ext+int(ew/2),ey+mask_ext+int(ew/2)),1,(128,128,128,0.1),-1)

            if count_eye > 2 and EyeCatch > 0:
                continue
            if count_eye < EyeCatch:
                continue

            cv2.putText(img_draw, "Fact Detect", (0,12), cv2.FONT_HERSHEY_COMPLEX, 0.4, (160,160,160))
            cv2.putText(img_draw, "Eyes Catch: {0}".format(count_eye), (0,24), cv2.FONT_HERSHEY_COMPLEX, 0.3, (160,160,160))
            img_draw = cv2.addWeighted(roi_draw, 1, img_draw, 0.3, 0)
            frame[y-mask_ext:y+h+mask_ext, x-mask_ext:x+w+mask_ext] = img_draw

            if countCatch == 1 or it.toNext:
                it.toNext = False
                cv2.imwrite('{0}/{1}.png'.format(SavePath, countCatch), frameBak)
                print("CF:" + str(countCatch), end = '\n', flush = True)
                countCatch+=1

    cv2.imshow("FaceCatch",frame)
cap.release()
cv2.waitKey(3000)
cv2.destroyAllWindows()
