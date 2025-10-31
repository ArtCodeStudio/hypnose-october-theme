var start = () => {
  const forms = window.document.querySelectorAll(".form-group");
  let result = "";
  for (const form of forms) {
    if (!form.id.startsWith("Form-field-ThemeData-bs4_")) {
      continue;
    }
    if (form.classList.contains("section-field")) {
      result += `\n// ${form.firstElementChild.textContent.trim()}\n`;
    }
    if (form.classList.contains("widget-field")) {
      const label = form.querySelector("label").textContent.trim();
      const colorpicker = form.querySelector(".field-colorpicker");

      let value = "null";

      if (colorpicker) {
        value = colorpicker.querySelector("input").value;
      }

      result += `$${label}: ${value};\n`;
    }
    if (form.classList.contains("text-field")) {
      const label = form.querySelector("label").textContent.trim();
      let value = form.querySelector("input").value;

      result += `$${label}: ${value};\n`;
    }
    if (form.classList.contains("checkbox-field")) {
      const label = form.querySelector("label").textContent.trim();
      let value = !!form.querySelector('input[type="checkbox"]').checked;

      result += `$${label}: ${value};\n`;
    }
    if (form.classList.contains("number-field")) {
      const label = form.querySelector("label").textContent.trim();
      let value = form.querySelector('input[type="number"]').value;

      result += `$${label}: ${value};\n`;
    }
  }

  console.log(result);
};

start();
