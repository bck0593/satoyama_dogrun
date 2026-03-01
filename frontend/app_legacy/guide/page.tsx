import Link from "next/link"
import { ArrowLeft, ExternalLink, Smartphone, FileText } from "lucide-react"
import BottomTabBar from "../components/bottom-tab-bar"

export default function GuidePage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-strong">申込みの流れ</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Introduction */}
        <section className="bg-blue-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-brand-primary mb-3">FC今治コミュニティへようこそ</h2>
          <p className="text-gray-700 leading-relaxed">
            FC今治では様々なコミュニティイベントを開催しています。
            イベントによって申込み方法が異なりますので、以下をご確認ください。
          </p>
        </section>

        {/* Application Types */}
        <section>
          <h2 className="text-lg font-bold text-strong mb-4">申込み方法について</h2>

          <div className="space-y-4">
            {/* External Link */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2 mt-1">
                  <ExternalLink className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">外部サイトでの申込み</h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    専用の申込みサイトへ移動して手続きを行います。 大規模なイベントやフェスティバルなどで使用されます。
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">例：TINY GARDEN FESTIVAL</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Internal Form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">アプリ内での申込み</h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    このアプリ内で直接申込みができます。 Googleアカウントでのログインが必要です。
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">例：FC今治アカデミー体験会</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Application */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 rounded-full p-2 mt-1">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">紙での申込み</h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    申込用紙に記入して提出していただきます。 配布場所や提出先はイベント詳細でご確認ください。
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">例：里山ドッグラン開放日</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-lg font-bold text-strong mb-4">参加までの流れ</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">イベントを探す</h4>
                <p className="text-gray-600 text-sm">
                  ホームページや「探す」タブからお好みのイベントを見つけてください。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">詳細を確認</h4>
                <p className="text-gray-600 text-sm">開催日時、場所、参加費、持ち物などを確認してください。</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">申込み手続き</h4>
                <p className="text-gray-600 text-sm">イベントの申込み方法に従って手続きを行ってください。</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">当日参加</h4>
                <p className="text-gray-600 text-sm">
                  確認メールや申込み完了通知を持参して、イベントをお楽しみください。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gray-50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-strong mb-3">お困りの時は</h2>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            申込み方法がわからない場合や、技術的な問題が発生した場合は、 お気軽にお問い合わせください。
          </p>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">電話：</span>
              <span className="text-gray-600">0898-35-2020</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">メール：</span>
              <span className="text-gray-600">community@fcimabari.com</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">受付時間：</span>
              <span className="text-gray-600">平日 9:00-17:00</span>
            </div>
          </div>
        </section>
      </div>

      <BottomTabBar />
    </div>
  )
}
