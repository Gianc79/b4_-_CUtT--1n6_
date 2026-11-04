import React from 'react';

export const HelpView: React.FC = () => {
  return (
    <section className="page active" id="page-help">
      <div className="section-head">
        <div>
          <h2>Guida rapida</h2>
          <p>Indicazioni per usare la versione base dell'applicazione.</p>
        </div>
      </div>
      <div className="guide-list">
        <div className="guide-item">
          <div className="guide-num">1</div>
          <div>
            <h4>Compila Giacenza e Richiesta</h4>
            <p>
              Inserisci in ogni record diametro, quantità e lunghezza. Il diametro deve essere uno dei
              numeri pari da 6 a 40 mm; Nr. deve essere un numero intero positivo da 1 a 10.000; la
              lunghezza deve essere un numero intero positivo da 1 a 1.200 cm. Il peso e i totali di
              Sviluppo e Peso sono calcolati automaticamente. Usa “＋ Aggiungi Riga” per inserire una riga
              e la X sulla riga per eliminarla; la X nell'intestazione svuota la tabella previa conferma.
            </p>
          </div>
        </div>
        <div className="guide-item">
          <div className="guide-num">2</div>
          <div>
            <h4>Ordina o usa file Excel</h4>
            <p>
              Il pulsante “Ordina” apre una finestra in cui puoi impostare fino a tre livelli di ordinamento,
              scegliendo tra Diametro [mm], Nr. e Lunghezza [cm]. Per ciascun livello seleziona l'ordine
              crescente o decrescente. Usa “Aggiungi livello” per aggiungere un criterio e “Elimina livello”
              per rimuovere l'ultimo criterio. I pulsanti “Importa XLS” e “Esporta XLS” si trovano in alto
              accanto al titolo di Giacenza e Richiesta e gestiscono file Excel in formato .xlsx separati per
              ciascuna tabella. Il file deve contenere almeno le colonne Diametro [mm], Nr. e L [cm]; se
              contiene anche una colonna Peso, questa viene ignorata e il peso è ricalcolato dall'applicazione.
              I campi Diametro, Nr. e L [cm] vengono normalizzati a interi durante l'importazione, dopo
              l'inserimento manuale e nell'esportazione. Sono corretti soltanto gli scostamenti
              infinitesimali dovuti alla rappresentazione numerica; i valori realmente decimali vengono
              rifiutati. L'esportazione genera un file con le sole colonne Diametro [mm], Nr. e L [cm],
              memorizzate e formattate come interi. L'importazione sostituisce la tabella interessata dopo
              conferma. L'esportazione apre la finestra di salvataggio quando il browser la supporta; negli
              altri browser il file viene scaricato nella cartella predefinita.
            </p>
          </div>
        </div>
        <div className="guide-item">
          <div className="guide-num">3</div>
          <div>
            <h4>Esegui l'ottimizzazione</h4>
            <p>
              Apri la pagina “Ottimizzazione” e premi “Esegui ottimizzazione”. Il motore usa direttamente i
              dati presenti nelle pagine Giacenza e Richiesta ed elabora separatamente ciascun diametro. Cerca
              di evadere la massima quantità di tagli richiesta e, tra le soluzioni che consentono la stessa
              evasione, favorisce lo sfrido complessivo minore. Gli sfridi sono riutilizzati soltanto per lo
              stesso diametro. Lo spessore dello strumento di taglio non è considerato.
            </p>
          </div>
        </div>
        <div className="guide-item">
          <div className="guide-num">4</div>
          <div>
            <h4>Leggi e aggiorna i risultati</h4>
            <p>
              La pagina “Ottimizzazione” mostra il Piano di taglio operativo, il Riepilogo barre
              utilizzate, la Richiesta non evasa e la Giacenza residua. Il Piano traduce le combinazioni
              ottimizzate in passaggi successivi: prima i tagli più lunghi, poi quelli più corti; il
              recupero di un passaggio diventa la barra disponibile per il passaggio successivo. All’interno
              di ogni misura di taglio, le configurazioni sono ordinate dalla barra più lunga alla più corta.
              Nelle righe operative il Peso considera i tagli eseguiti e lo scarto finale; il totale si
              riferisce al peso delle barre originarie utilizzate, senza conteggiare più volte il recupero.
              Puoi esportare il Piano in formato Excel (.xlsx): il file contiene tutte le righe operative,
              senza la colonna Peso e senza la riga Totale. Selezionando record nella “Richiesta non evasa” e
              premendo “Aggiorna Richiesta”, la tabella Richiesta viene sostituita con i record selezionati.
              Selezionando record nella “Giacenza residua” e premendo “Aggiorna Giacenza”, la Giacenza
              esistente viene sostituita per i diametri presenti nel riquadro, usando soltanto i record
              selezionati; gli altri diametri restano invariati.
            </p>
          </div>
        </div>
        <div className="guide-item">
          <div className="guide-num">5</div>
          <div>
            <h4>Salva o trasferisci i dati</h4>
            <p>
              I dati sono conservati localmente nel browser. Usa “Salva” o “Salva con nome” per creare un
              backup JSON da ricaricare con “Carica file”. Per scambiare soltanto Giacenza o Richiesta con
              altri programmi, usa i rispettivi pulsanti XLS per creare o leggere file Excel (.xlsx) separati.
              Le finestre di salvataggio e il percorso Download dipendono dalle funzionalità del browser.
            </p>
          </div>
        </div>
        <div className="guide-item">
          <div className="guide-num">6</div>
          <div>
            <h4>Limiti del motore</h4>
            <p>
              Il motore usa una strategia deterministica che minimizza lo sfrido a ogni iterazione: non
              garantisce il minimo sfrido assoluto ma, tra le soluzioni che consentono di evadere la massima
              quantità di tagli richiesta, predilige quella con lo sfrido complessivo minore.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
