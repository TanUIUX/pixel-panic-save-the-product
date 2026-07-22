          mm.appendChild(el('p',{class:'muted',style:{fontSize:'13px',margin:'8px 0 14px'}},'Hành động này xóa toàn bộ dữ liệu lưu cục bộ và không thể hoàn tác.'));
          mm.appendChild(el('button',{class:'btn danger wide',onclick:()=>{ localStorage.removeItem(SAVE_KEY); SAVE=defaultSave(); applySettings(); closeModal(); buildMenu(); showScreen('menu'); toast('Đã xóa tài khoản'); }},'Xóa vĩnh viễn'));
          mm.appendChild(el('button',{class:'btn ghost sm wide',style:{marginTop:'8px'},onclick:()=>openSettings()},'Hủy'));
        });
      }},'Delete Account'));
    }
    m.appendChild(el('button',{class:'btn primary wide',style:{marginTop:'14px'},onclick:closeModal},'Xong'));
  });
}
