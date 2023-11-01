function manipulatePeople(tempJSON) {
  var arrPeopleNew = [];
  tempJSON.forEach(function (arrItem) {
    if (arrItem.Betrieb.indexOf($("#locations option:selected").text()) == 0) {
      arrPeopleNew.push({
        id: arrItem.id.toString(),
        name: arrItem.Name,
        color: arrItem.farbe,
      });
    }
  });
  return arrPeopleNew;
}

function manipulateAssignments(tempJSON) {
  var arrAssignmentNew = [];
  tempJSON.forEach(function (arrItem) {
    // var sTimeStart = arrItem.starttime.replace('T', ' ') + ':00';
    // var sTimeEnd = arrItem.endtime.replace('T', ' ') + ':00';
    if (arrItem.starttime.length < 16) {
      var sTimeStart = arrItem.starttime;
    } else {
      var sTimeStart = arrItem.starttime //+ ":00";
    }
    if (arrItem.endtime.length < 16) {
      var sTimeEnd = arrItem.endtime;
    } else {
      var sTimeEnd = arrItem.endtime// + ":00";
    }

    var lSingleContent = {
      id: arrItem.id,
      text: "",
      start: sTimeStart,
      end: sTimeEnd,
      resource: arrItem.stamm_id.toString(),
    };
    lSingleContent.person = arrItem.stamm_id.toString();
    console.log(arrItem.stamm_id.toString());
    lSingleContent.location = $("#locations").val().toString();
    lSingleContent.join = arrItem.id.toString();
    arrAssignmentNew.push(lSingleContent);

    var lSingleContent1 = {
      id: "L" + arrItem.id.toString(),
      text: "",
      start: sTimeStart,
      end: sTimeEnd,
      resource: "L" + $("#locations").val().toString(),
    };
    lSingleContent1.person = arrItem.stamm_id.toString();
    lSingleContent1.location = $("#locations").val().toString();
    lSingleContent1.type = "location";
    lSingleContent1.join = arrItem.id.toString();
    arrAssignmentNew.push(lSingleContent1);
  });
  return arrAssignmentNew;
}

/*
        $e->id = $row['id'];
    $e->text = "";
    $e->start = $row['assignment_start'];
    $e->end = $row['assignment_end'];
    $e->resource = $row['person_id'];

    $e->person = $row['person_id'];
    $e->location = $row['location_id'];
    $e->join = $row['id'];
    $events[] = $e;

    $e = new Event();
    $e->id = "L".$row['id'];
    $e->text = "";
    $e->start = $row['assignment_start'];
    $e->end = $row['assignment_end'];
    $e->resource = 'L'.$row['location_id'];

    $e->person = $row['person_id'];
    $e->location = $row['location_id'];
    $e->type = 'location';
    $e->join = $row['id'];
*/
