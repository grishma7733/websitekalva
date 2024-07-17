document.addEventListener('DOMContentLoaded', function () {
  const bedtcInput = document.getElementById('bedtc');
  const unitNoInput = document.getElementById('unitNo');
  const coachSelection = document.getElementById('coachSelection');
  const schedulerForm = document.getElementById('schedulerForm');
  const searchBtn = document.getElementById('searchBtn');


  searchBtn.addEventListener('click', function () {
    const bedtc = bedtcInput.value;
    if (bedtc) {
      fetchUnitNo(bedtc);
    } else {
      unitNoInput.value = '';
      coachSelection.innerHTML = '';
    }
  });

  function fetchUnitNo(bedtc) {
    console.log("Fetching unit no for BEDTC:", bedtc);

    const url = `/unit_no/(bedtc)`;
    console.log("Request URL:", url);

    fetch(url)
        .then(response => {
            console.log("Fetch response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetch response data:", data);
            if (data.error) {
                throw new Error(data.error);
            }
            if (data.length) {
                unitNoInput.value = data[0].unit_no;
            } else {
                unitNoInput.value = '';
            }
            fetchCoaches(bedtc);
        })
        .catch(e => {
            console.error('Fetch error:', e);
            unitNoInput.value = '';
            coachSelection.innerHTML = '';
            alert(`Error: ${e.message}`);
        });
}

  function fetchCoaches(bedtc) {
    fetch(`/rake_formation/${bedtc}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        coachSelection.innerHTML = '';
        data.forEach(function (coach) {
          const label = document.createElement('label');
          label.innerHTML = `
            <input type="checkbox" name="coaches" value="${coach.rake_formation}"> ${coach.rake_formation}
          `;
          coachSelection.appendChild(label);
        });
      })
      .catch(e => {
        console.error('Fetch error:', e);
        coachSelection.innerHTML = '';
        alert(`Error: ${e.message}`);
      });
  }



  schedulerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    fetch('/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      alert(data.message);
    })
    .catch(e => {
      console.error('Submit error:', e);
      alert(`Error: ${e.message}`);
    });
  });
});