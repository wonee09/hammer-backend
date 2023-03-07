const express = require('express');
const { Address } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const router = express.Router();

/**
 * name : 주소정보 입력(주소검색 후, 선택할 때)
 * description : 이미 존재하는 정보이면 id만 return, 존재하지 않는 정보이면 create 후 id return
 * writer : Jay Choi
 * date : 2023.03.07
 */
router.post('/address', authMiddleware, async (req, res) => {
  // 위치정보 관련 정보
  const {
    zoneNo,
    totalRoadAddress,
    roadName,
    buildingName,
    mainBuildingNo,
    subBuildingNo,
    undergroundYn,
    xLoc,
    yLoc,
  } = req.body;

  // 입력하기 전, zoneNo와 totalRoadAddress가 일치하는 것이 있으면 pass, 없으면 새로 insert
  const registeredAddress = await Address.findOne({
    // attributes: ['id'],
    where: { zoneNo, totalRoadAddress },
  });

  if (registeredAddress) {
    return res.status(201).json({ data: registeredAddress });
  } else {
    // 입력 값
    //
    const address = await Address.create({
      zoneNo,
      totalRoadAddress,
      roadName,
      buildingName,
      mainBuildingNo,
      subBuildingNo,
      undergroundYn,
      xLoc,
      yLoc,
    });
    return res.status(201).json({ data: address });
  }
});

module.exports = router;
