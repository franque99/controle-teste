import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Torneio {
  id: number;
  data: string;
  nome: string;
  sala: string;
  buyIn: number;
  premiacao: number;
  lucro: number;
}

const salas = [
  "WPT Global",
  "CoinPoker",
  "PokerStars",
  "ChampionPoker",
  "YaPoker",
  "PokerStars.es",
  "partypoker",
  "888poker",
  "GGPoker",
  "VangPoker",
];

export default function App() {
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [data, setData] = useState("");
  const [nome, setNome] = useState("");
  const [sala, setSala] = useState(salas[0]);
  const [buyIn, setBuyIn] = useState(0);
  const [premiacao, setPremiacao] = useState(0);
  const [mesFiltro, setMesFiltro] = useState("");
  const [anoFiltro, setAnoFiltro] = useState("");
  const [salaFiltro, setSalaFiltro] = useState("");
  const [bankrollInicial, setBankrollInicial] = useState(0);

  // Novo estado para edição
  const [torneioEditando, setTorneioEditando] = useState<Torneio | null>(null);

  // Carregar dados salvos
  useEffect(() => {
    const dadosTorneios = localStorage.getItem("torneios");
    if (dadosTorneios) setTorneios(JSON.parse(dadosTorneios));

    const dadosBankroll = localStorage.getItem("bankrollInicial");
    if (dadosBankroll) setBankrollInicial(parseFloat(dadosBankroll));
  }, []);

  // Salvar dados
  useEffect(() => {
    localStorage.setItem("torneios", JSON.stringify(torneios));
  }, [torneios]);

  useEffect(() => {
    localStorage.setItem("bankrollInicial", bankrollInicial.toString());
  }, [bankrollInicial]);

  function adicionarOuAtualizarTorneio(e: React.FormEvent) {
    e.preventDefault();
    if (buyIn > 10) {
      alert("O buy-in não pode ser maior que $10");
      return;
    }
    const novoOuAtualizado: Torneio = {
      id: torneioEditando ? torneioEditando.id : Date.now(),
      data,
      nome,
      sala,
      buyIn,
      premiacao,
      lucro: premiacao - buyIn,
    };
    if (torneioEditando) {
      setTorneios(
        torneios.map((t) => (t.id === novoOuAtualizado.id ? novoOuAtualizado : t))
      );
      setTorneioEditando(null);
    } else {
      setTorneios([novoOuAtualizado, ...torneios]);
    }
    limparFormulario();
  }

  function limparFormulario() {
    setData("");
    setNome("");
    setSala(salas[0]);
    setBuyIn(0);
    setPremiacao(0);
  }

  function deletarTorneio(id: number) {
    if (window.confirm("Tem certeza que deseja deletar este torneio?")) {
      setTorneios(torneios.filter((t) => t.id !== id));
    }
  }

  function carregarParaEdicao(torneio: Torneio) {
    setTorneioEditando(torneio);
    setData(torneio.data);
    setNome(torneio.nome);
    setSala(torneio.sala);
    setBuyIn(torneio.buyIn);
    setPremiacao(torneio.premiacao);
  }

  // Filtro
  const torneiosFiltrados = torneios.filter((t) => {
    const [ano, mes] = t.data.split("-");
    return (
      (mesFiltro ? mes === mesFiltro : true) &&
      (anoFiltro ? ano === anoFiltro : true) &&
      (salaFiltro ? t.sala === salaFiltro : true)
    );
  });

  // Estatísticas
  const totalInvestido = torneiosFiltrados.reduce((acc, t) => acc + t.buyIn, 0);
  const totalGanho = torneiosFiltrados.reduce((acc, t) => acc + t.premiacao, 0);
  const lucroTotal = totalGanho - totalInvestido;
  const roi = totalInvestido > 0 ? ((lucroTotal / totalInvestido) * 100).toFixed(2) : "0.00";

  // Cálculos do Bankroll
  const bankrollAtual = bankrollInicial + lucroTotal;

  // Dados do gráfico
  const graficoLabels = [...torneiosFiltrados]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .map((t) => t.data);

  let acumulado = 0;
  const graficoDados = [...torneiosFiltrados]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .map((t) => {
      acumulado += t.lucro;
      return acumulado;
    });

  const chartData = {
    labels: graficoLabels,
    datasets: [
      {
        label: "Lucro Acumulado ($)",
        data: graficoDados,
        borderColor: "rgb(37, 99, 235)",
        backgroundColor: "rgba(37, 99, 235, 0.5)",
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
        TZ Controle de Grind
      </h1>

      {/* Seção de Bankroll */}
      <div className="max-w-5xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-gray-800 p-4 rounded shadow-lg">
          <p className="text-gray-400">Bankroll Inicial</p>
          <input
            type="number"
            value={bankrollInicial}
            onChange={(e) => setBankrollInicial(parseFloat(e.target.value) || 0)}
            className="text-lg font-bold w-full text-center border-b-2 border-gray-700 bg-gray-800 focus:border-blue-400 outline-none text-white"
            step="10"
          />
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-lg col-span-1 md:col-span-2">
          <p className="text-gray-400">Bankroll Atual</p>
          <p className={`text-lg font-bold ${bankrollAtual >= 0 ? "text-green-400" : "text-red-400"}`}>
            ${bankrollAtual.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filtros de Sala */}
      <div className="max-w-5xl mx-auto mb-4 flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setSalaFiltro("")}
          className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-200 ${
            salaFiltro === "" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
          }`}
        >
          Todas
        </button>
        {salas.map((s) => (
          <button
            key={s}
            onClick={() => setSalaFiltro(s)}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-200 ${
              salaFiltro === s ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Formulário */}
      <form
        onSubmit={adicionarOuAtualizarTorneio}
        className="max-w-5xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-6 gap-4 bg-gray-800 p-4 rounded shadow-lg"
      >
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="border border-gray-700 p-2 rounded col-span-2 md:col-span-1 bg-gray-700 text-white"
          required
        />
        <input
          type="text"
          placeholder="Nome do Torneio"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="border border-gray-700 p-2 rounded col-span-2 md:col-span-1 bg-gray-700 text-white"
          required
        />
        <select
          value={sala}
          onChange={(e) => setSala(e.target.value)}
          className="border border-gray-700 p-2 rounded col-span-2 md:col-span-1 bg-gray-700 text-white"
        >
          {salas.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Buy-in ($)"
          value={buyIn}
          onChange={(e) => setBuyIn(parseFloat(e.target.value))}
          step="0.01"
          className="border border-gray-700 p-2 rounded col-span-1 bg-gray-700 text-white"
          required
        />
        <input
          type="number"
          placeholder="Premiação ($)"
          value={premiacao}
          onChange={(e) => setPremiacao(parseFloat(e.target.value))}
          step="0.01"
          className="border border-gray-700 p-2 rounded col-span-1 bg-gray-700 text-white"
          required
        />
        <button
          type="submit"
          className="col-span-2 md:col-span-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {torneioEditando ? "Salvar Edição" : "Adicionar Torneio"}
        </button>
      </form>

      {/* Filtros de Data */}
      <div className="max-w-5xl mx-auto mb-4 flex gap-4 justify-center">
        <select
          value={mesFiltro}
          onChange={(e) => setMesFiltro(e.target.value)}
          className="border border-gray-700 p-2 rounded bg-gray-700 text-white"
        >
          <option value="">Todos os meses</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
              {String(i + 1).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          value={anoFiltro}
          onChange={(e) => setAnoFiltro(e.target.value)}
          className="border border-gray-700 p-2 rounded bg-gray-700 text-white"
        >
          <option value="">Todos os anos</option>
          {[...new Set(torneios.map((t) => t.data.split("-")[0]))].map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </select>
      </div>

      {/* Estatísticas */}
      <div className="max-w-5xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-800 p-4 rounded shadow-lg">
          <p className="text-gray-400">Investido</p>
          <p className="text-lg font-bold text-white">${totalInvestido.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-lg">
          <p className="text-gray-400">Ganho</p>
          <p className="text-lg font-bold text-white">${totalGanho.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-lg">
          <p className="text-gray-400">Lucro</p>
          <p className={`text-lg font-bold ${lucroTotal >= 0 ? "text-green-400" : "text-red-400"}`}>
            ${lucroTotal.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-lg">
          <p className="text-gray-400">ROI</p>
          <p className="text-lg font-bold text-white">{roi}%</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="max-w-5xl mx-auto bg-gray-800 p-4 rounded shadow-lg mb-6">
        <Line data={chartData} />
      </div>

      {/* Tabela */}
      <div className="max-w-5xl mx-auto overflow-x-auto">
        <table className="w-full bg-gray-800 border-collapse rounded shadow-lg">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 border-b border-gray-600">Data</th>
              <th className="p-2 border-b border-gray-600">Nome</th>
              <th className="p-2 border-b border-gray-600">Sala</th>
              <th className="p-2 border-b border-gray-600">Buy-in</th>
              <th className="p-2 border-b border-gray-600">Premiação</th>
              <th className="p-2 border-b border-gray-600">Lucro</th>
              <th className="p-2 border-b border-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {torneiosFiltrados.map((t) => (
              <tr key={t.id} className="text-center hover:bg-gray-700">
                <td className="p-2 border-b border-gray-700">{t.data}</td>
                <td className="p-2 border-b border-gray-700">{t.nome}</td>
                <td className="p-2 border-b border-gray-700">{t.sala}</td>
                <td className="p-2 border-b border-gray-700">${t.buyIn.toFixed(2)}</td>
                <td className="p-2 border-b border-gray-700">${t.premiacao.toFixed(2)}</td>
                <td className={`p-2 border-b border-gray-700 ${t.lucro >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ${t.lucro.toFixed(2)}
                </td>
                <td className="p-2 border-b border-gray-700">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => carregarParaEdicao(t)}
                      className="text-blue-400 hover:text-blue-200 font-bold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deletarTorneio(t.id)}
                      className="text-red-400 hover:text-red-200 font-bold"
                    >
                      Deletar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
